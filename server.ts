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
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Initialize Database
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
        default_currency TEXT DEFAULT 'TRY',
        background_image_url TEXT,
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
        role TEXT CHECK(role IN ('superadmin', 'storeadmin', 'editor', 'viewer')) NOT NULL,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );
    `);

    // Ensure columns exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='default_currency') THEN
          ALTER TABLE stores ADD COLUMN default_currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='background_image_url') THEN
          ALTER TABLE stores ADD COLUMN background_image_url TEXT;
        END IF;
      END $$;
    `);

    // Seed Super Admin if not exists
    const adminEmail = "admin@pricecheck.com";
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
  await initDb();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

  app.use(express.json());

  const upload = multer({ dest: "uploads/" });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
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

  // Public: Get Product by Barcode and Store Slug
  app.get("/api/public/scan/:slug/:barcode", async (req, res) => {
    const { slug, barcode } = req.params;
    const storeRes = await pool.query("SELECT id, name, logo_url, primary_color, default_currency, background_image_url FROM stores WHERE slug = $1", [slug]);
    const store = storeRes.rows[0];
    if (!store) return res.status(404).json({ error: "Store not found" });

    const productRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND barcode = $2", [store.id, barcode]);
    const product = productRes.rows[0];
    if (!product) return res.status(404).json({ error: "Product not found", store });

    // Log the scan
    await pool.query("INSERT INTO scan_logs (store_id, product_id) VALUES ($1, $2)", [store.id, product.id]);

    res.json({ ...product, store });
  });

  // Public: Get Store Info (for branding on scan page load)
  app.get("/api/public/store/:slug", async (req, res) => {
    const storeRes = await pool.query("SELECT name, logo_url, primary_color, default_currency, background_image_url FROM stores WHERE slug = $1", [req.params.slug]);
    const store = storeRes.rows[0];
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userRes.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, role: user.role, store_id: user.store_id }, JWT_SECRET);
    res.json({ token, user: { email: user.email, role: user.role, store_id: user.store_id } });
  });

  // SuperAdmin: Manage Stores
  app.get("/api/admin/stats", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    
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
  });

  app.get("/api/admin/stores", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const stores = await pool.query(`
      SELECT s.*, u.email as admin_email 
      FROM stores s 
      LEFT JOIN users u ON s.id = u.store_id AND u.role = 'storeadmin'
    `);
    res.json(stores.rows);
  });

  app.post("/api/admin/stores/bulk-subscription", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { storeIds, days } = req.body;
    if (!storeIds || !Array.isArray(storeIds) || !days) return res.status(400).json({ error: "Invalid data" });

    try {
      await pool.query("BEGIN");
      for (const id of storeIds) {
        await pool.query(`
          UPDATE stores 
          SET subscription_end = COALESCE(subscription_end, CURRENT_DATE) + ($1 || ' days')::INTERVAL 
          WHERE id = $2
        `, [days, id]);
      }
      await pool.query("COMMIT");
      res.json({ success: true });
    } catch (e) {
      await pool.query("ROLLBACK");
      res.status(500).json({ error: "Bulk update failed" });
    }
  });

  app.post("/api/admin/stores", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { name, slug, address, contact_person, phone, email, subscription_end, admin_email, admin_password, default_currency } = req.body;
    try {
      await pool.query("BEGIN");
      const storeRes = await pool.query(
        "INSERT INTO stores (name, slug, address, contact_person, phone, email, subscription_end, default_currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
        [name, slug, address, contact_person, phone, email, subscription_end, default_currency || 'TRY']
      );
      const storeId = storeRes.rows[0].id;
      const hashedPassword = bcrypt.hashSync(admin_password, 10);
      await pool.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, admin_email, hashedPassword, "storeadmin"]);
      await pool.query("COMMIT");
      res.json({ success: true, storeId });
    } catch (e: any) {
      await pool.query("ROLLBACK");
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/admin/stores/:id", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { name, slug, address, contact_person, phone, email, subscription_end, default_currency } = req.body;
    try {
      await pool.query(`
        UPDATE stores 
        SET name = $1, slug = $2, address = $3, contact_person = $4, phone = $5, email = $6, subscription_end = $7, default_currency = $8
        WHERE id = $9
      `, [name, slug, address, contact_person, phone, email, subscription_end, default_currency || 'TRY', req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // StoreAdmin: Manage Products
  app.get("/api/store/info", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });
    
    const storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
    const store = storeRes.rows[0];
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  });

  app.post("/api/store/branding", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { logo_url, primary_color, default_currency, background_image_url } = req.body;
    await pool.query("UPDATE stores SET logo_url = $1, primary_color = $2, default_currency = $3, background_image_url = $4 WHERE id = $5", [logo_url, primary_color, default_currency || 'TRY', background_image_url, storeId]);
    res.json({ success: true });
  });

  app.get("/api/store/analytics", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const totalScans = (await pool.query("SELECT COUNT(*) as count FROM scan_logs WHERE store_id = $1", [storeId])).rows[0];
    const scansByDay = await pool.query(`
      SELECT d.date, COALESCE(s.count, 0) as count FROM (
        SELECT (CURRENT_DATE - (n || ' days')::INTERVAL)::DATE as date
        FROM generate_series(0, 6) n
      ) d
      LEFT JOIN (
        SELECT DATE(created_at) as scan_date, COUNT(*) as count 
        FROM scan_logs 
        WHERE store_id = $1 
        GROUP BY DATE(created_at)
      ) s ON d.date = s.scan_date
      ORDER BY date ASC
    `, [storeId]);

    const topProducts = await pool.query(`
      SELECT p.name, p.barcode, COUNT(l.id) as count 
      FROM scan_logs l 
      JOIN products p ON l.product_id = p.id 
      WHERE l.store_id = $1 
      GROUP BY l.product_id, p.name, p.barcode 
      ORDER BY count DESC 
      LIMIT 5
    `, [storeId]);

    const recentScans = await pool.query(`
      SELECT p.name, p.barcode, l.created_at 
      FROM scan_logs l 
      JOIN products p ON l.product_id = p.id 
      WHERE l.store_id = $1 
      ORDER BY l.created_at DESC 
      LIMIT 10
    `, [storeId]);

    res.json({
      totalScans,
      scansByDay: scansByDay.rows,
      topProducts: topProducts.rows,
      recentScans: recentScans.rows
    });
  });

  app.get("/api/store/users", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const users = await pool.query("SELECT id, email, role FROM users WHERE store_id = $1", [storeId]);
    res.json(users.rows);
  });

  app.post("/api/store/users", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { email, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      await pool.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, email, hashedPassword, role]);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.delete("/api/store/users/:id", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    // Ensure user belongs to this store
    const userRes = await pool.query("SELECT * FROM users WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });

    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/store/products", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const products = await pool.query("SELECT * FROM products WHERE store_id = $1", [storeId]);
    res.json(products.rows);
  });

  app.post("/api/store/products", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { barcode, name, price, currency, description } = req.body;
    if (!barcode || !name || !price) return res.status(400).json({ error: "Missing fields" });
    try {
      await pool.query(`
        INSERT INTO products (store_id, barcode, name, price, currency, description) 
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (store_id, barcode) 
        DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, currency = EXCLUDED.currency, description = EXCLUDED.description
      `, [storeId, String(barcode), name, parseFloat(price), currency || 'TRY', description || '']);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/store/products/:id", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { id } = req.params;
    const { barcode, name, price, currency, description } = req.body;
    try {
      await pool.query("UPDATE products SET barcode = $1, name = $2, price = $3, currency = $4, description = $5 WHERE id = $6 AND store_id = $7", 
        [String(barcode), name, parseFloat(price), currency || 'TRY', description || '', id, storeId]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/store/products/all", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    await pool.query("DELETE FROM products WHERE store_id = $1", [storeId]);
    res.json({ success: true });
  });

  app.delete("/api/store/products/:id", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { id } = req.params;
    await pool.query("DELETE FROM products WHERE id = $1 AND store_id = $2", [id, storeId]);
    res.json({ success: true });
  });

  // StoreAdmin: Import Data
  app.post("/api/store/import", authenticate, upload.single("file"), async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let mapping;
    try {
      mapping = JSON.parse(req.body.mapping);
    } catch (e) {
      return res.status(400).json({ error: "Invalid mapping data" });
    }

    if (!mapping.barcode || !mapping.name || !mapping.price) {
      return res.status(400).json({ error: "Barcode, Name, and Price columns must be mapped" });
    }
    
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', codepage: 65001 });
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (data.length === 0) {
        return res.status(400).json({ error: "The uploaded file is empty" });
      }

      let successCount = 0;
      await pool.query("BEGIN");
      for (const item of data as any[]) {
        const barcode = String(item[mapping.barcode] || "").trim();
        const name = String(item[mapping.name] || "").trim();
        const priceStr = String(item[mapping.price] || "0").replace(/[^0-9.,]/g, "").replace(",", ".");
        const price = parseFloat(priceStr);

        if (barcode && name && !isNaN(price)) {
          const currency = item[mapping.currency] || mapping.currency || 'TRY';
          await pool.query(`
            INSERT INTO products (store_id, barcode, name, price, currency, description) 
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (store_id, barcode) 
            DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, currency = EXCLUDED.currency, description = EXCLUDED.description
          `, [
            storeId,
            barcode,
            name,
            price,
            currency,
            item[mapping.description] || ''
          ]);
          successCount++;
        }
      }
      await pool.query("COMMIT");
      fs.unlinkSync(req.file.path);
      res.json({ success: true, count: successCount, total: data.length });
    } catch (e: any) {
      await pool.query("ROLLBACK");
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(400).json({ error: e.message });
    }
  });

  // CRM: Tickets
  app.get("/api/tickets", authenticate, async (req: any, res) => {
    let tickets;
    if (req.user.role === "superadmin") {
      tickets = await pool.query("SELECT t.*, s.name as store_name FROM tickets t JOIN stores s ON t.store_id = s.id");
    } else {
      tickets = await pool.query("SELECT * FROM tickets WHERE store_id = $1", [req.user.store_id]);
    }
    res.json(tickets.rows);
  });

  app.post("/api/tickets", authenticate, async (req: any, res) => {
    if (req.user.role !== "storeadmin") return res.status(403).json({ error: "Forbidden" });
    const { subject, message } = req.body;
    await pool.query("INSERT INTO tickets (store_id, subject, message) VALUES ($1, $2, $3)", [req.user.store_id, subject, message]);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}


startServer();
