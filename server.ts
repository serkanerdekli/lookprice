import express from "express";
import { createServer as createViteServer } from "vite";
import pkg from 'pg';
const { Pool } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import * as XLSX from "xlsx";
import fs from "fs";
import dotenv from "dotenv";
import dns from 'node:dns';

// IPv6 (Supabase) bağlantı sorununu çözer
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        address TEXT,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        api_key TEXT UNIQUE,
        subscription_end DATE,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#4f46e5',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        barcode TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'TRY',
        description TEXT,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        UNIQUE(store_id, barcode)
      );

      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        store_id INTEGER,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );
    `);

    const adminEmail = "admin@lookprice.com";
    const existingAdmin = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await client.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3)", [adminEmail, hashedPassword, "superadmin"]);
    }
  } finally {
    client.release();
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "lookprice_secret_key";

  app.use(express.json());
  const upload = multer({ dest: "uploads/" });

  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- API ROUTES ---
  app.get("/api/public/scan/:slug/:barcode", async (req, res) => {
    try {
      const { slug, barcode } = req.params;
      const storeRes = await pool.query("SELECT id, name, logo_url, primary_color FROM stores WHERE slug = $1", [slug]);
      const store = storeRes.rows[0];
      if (!store) return res.status(404).json({ error: "Store not found" });
      const productRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND barcode = $2", [store.id, barcode]);
      const product = productRes.rows[0];
      if (!product) return res.status(404).json({ error: "Product not found", store });
      await pool.query("INSERT INTO scan_logs (store_id, product_id) VALUES ($1, $2)", [store.id, product.id]);
      res.json({ ...product, store });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/public/store/:slug", async (req, res) => {
    try {
      const storeRes = await pool.query("SELECT name, logo_url, primary_color FROM stores WHERE slug = $1", [req.params.slug]);
      if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });
      res.json(storeRes.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const user = userRes.rows[0];
      if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid credentials" });
      const token = jwt.sign({ id: user.id, role: user.role, store_id: user.store_id }, JWT_SECRET);
      res.json({ token, user: { email: user.email, role: user.role, store_id: user.store_id } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/stats", authenticate, async (req, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    try {
      const totalStores = (await pool.query("SELECT COUNT(*) as count FROM stores")).rows[0].count;
      const activeStores = (await pool.query("SELECT COUNT(*) as count FROM stores WHERE subscription_end > CURRENT_DATE")).rows[0].count;
      const totalScans = (await pool.query("SELECT COUNT(*) as count FROM scan_logs")).rows[0].count;
      const scansLast24h = (await pool.query("SELECT COUNT(*) as count FROM scan_logs WHERE created_at > NOW() - INTERVAL '1 day'")).rows[0].count;
      res.json({
        totalStores: parseInt(totalStores),
        activeStores: parseInt(activeStores),
        totalScans: parseInt(totalScans),
        scansLast24h: parseInt(scansLast24h)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/stores", authenticate, async (req, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    try {
      const stores = await pool.query("SELECT s.*, u.email as admin_email FROM stores s LEFT JOIN users u ON s.id = u.store_id AND u.role = 'storeadmin'");
      res.json(stores.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/stores", authenticate, async (req, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { name, slug, address, contact_person, phone, email, subscription_end, admin_email, admin_password } = req.body;
    try {
      await pool.query("BEGIN");
      const storeRes = await pool.query(
        "INSERT INTO stores (name, slug, address, contact_person, phone, email, subscription_end) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [name, slug, address, contact_person, phone, email, subscription_end]
      );
      const storeId = storeRes.rows[0].id;
      const hashedPassword = bcrypt.hashSync(admin_password, 10);
      await pool.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, admin_email, hashedPassword, "storeadmin"]);
      await pool.query("COMMIT");
      res.json({ success: true, storeId });
    } catch (e) {
      await pool.query("ROLLBACK");
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/store/products", authenticate, async (req, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    try {
      const products = await pool.query("SELECT * FROM products WHERE store_id = $1", [storeId]);
      res.json(products.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/store/products", authenticate, async (req, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    const { barcode, name, price, currency, description } = req.body;
    try {
      await pool.query(`
        INSERT INTO products (store_id, barcode, name, price, currency, description) 
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (store_id, barcode) 
        DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, currency = EXCLUDED.currency, description = EXCLUDED.description
      `, [storeId, String(barcode), name, parseFloat(price), currency || 'TRY', description || '']);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on port ${PORT}`);
    try {
      await initDb();
      console.log("Database initialized");
    } catch (err) {
      console.error("DB Init Error:", err.message);
    }
  });
}

startServer();
