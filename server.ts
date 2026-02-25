import dns from "node:dns";
// IPv6 sorununu çözmek için en üstte olmalı
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
import * as XLSX from "xlsx";
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

  // API Rotaları
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
      res.json(storeRes.rows[0] || { error: "Not found" });
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

  // Diğer API'ler (Admin, Store vb.)
  // ... (PostgreSQL uyumlu tüm fonksiyonlar buraya gelecek)

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
