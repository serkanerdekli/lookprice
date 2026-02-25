import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import { createServer as createViteServer } from "vite";
import pkg from 'pg';
const { Pool } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";

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
        name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, address TEXT,
        contact_person TEXT, phone TEXT, email TEXT, api_key TEXT UNIQUE,
        subscription_end DATE, logo_url TEXT, primary_color TEXT DEFAULT '#4f46e5',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY, store_id INTEGER NOT NULL, barcode TEXT NOT NULL,
        name TEXT NOT NULL, price REAL NOT NULL, currency TEXT DEFAULT 'TRY',
        description TEXT, FOREIGN KEY (store_id) REFERENCES stores(id),
        UNIQUE(store_id, barcode)
      );
      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY, store_id INTEGER NOT NULL, product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id), FOREIGN KEY (product_id) REFERENCES products(id)
      );
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, store_id INTEGER, email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL, role TEXT NOT NULL, FOREIGN KEY (store_id) REFERENCES stores(id)
      );
    `);
    const adminEmail = "admin@lookprice.com";
    const existingAdmin = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await client.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3)", [adminEmail, hashedPassword, "superadmin"]);
    }
  } finally { client.release(); }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "lookprice_secret_key";

  app.use(express.json());

  // --- API ROUTES ---
  app.get("/api/public/store/:slug", async (req, res) => {
    const storeRes = await pool.query("SELECT name, logo_url, primary_color, slug FROM stores WHERE slug = $1", [req.params.slug]);
    res.json(storeRes.rows[0] || { error: "Not found" });
  });

  app.get("/api/public/scan/:slug/:barcode", async (req, res) => {
    const { slug, barcode } = req.params;
    const storeRes = await pool.query("SELECT id FROM stores WHERE slug = $1", [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    const productRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND barcode = $2", [storeRes.rows[0].id, barcode]);
    if (productRes.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    await pool.query("INSERT INTO scan_logs (store_id, product_id) VALUES ($1, $2)", [storeRes.rows[0].id, productRes.rows[0].id]);
    res.json(productRes.rows[0]);
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userRes.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid" });
    const token = jwt.sign({ id: user.id, role: user.role, store_id: user.store_id }, JWT_SECRET);
    res.json({ token, user: { email: user.email, role: user.role, store_id: user.store_id } });
  });

  // --- VITE / STATIC SERVING (Beyaz Sayfa Çözümü) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // API isteklerini statik dosya servisiyle karıştırmamak için kontrol
      if (req.path.startsWith('/api')) return res.status(404).json({error: "API not found"});
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on port ${PORT}`);
    try { await initDb(); console.log("DB Ready"); } catch (e) { console.error("DB Error", e.message); }
  });
}

startServer();
