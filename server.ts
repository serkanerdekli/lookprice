import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import { createServer as createViteServer } from "vite";
import pkg from 'pg';
const { Pool } = pkg;
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "lookprice_secret_key";

// Veritabanı Bağlantısı
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Statik Dosya Yolu (BEYAZ SAYFA ÇÖZÜMÜ)
const rootDir = process.cwd();
const distPath = path.join(rootDir, "dist");

app.use(express.json());

// --- API Rotaları (En Üstte Olmalı) ---
app.get("/api/health", (req, res) => res.json({ status: "ok", mode: process.env.NODE_ENV }));

app.get("/api/public/store/:slug", async (req, res) => {
  try {
    const result = await pool.query("SELECT name, logo_url, primary_color, slug FROM stores WHERE slug = $1", [req.params.slug]);
    res.json(result.rows[0] || { error: "Store not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ... (Diğer API rotalarınız buraya gelebilir)

// --- FRONTEND SERVİSİ (BEYAZ SAYFAYI BİTİREN KISIM) ---
if (process.env.NODE_ENV === "production") {
  // 1. Önce dist klasöründeki gerçek dosyaları (js, css, resim) servis et
  app.use(express.static(distPath));

  // 2. Geri kalan tüm istekleri index.html'e yönlendir (React Router için)
  app.get("*", (req, res) => {
    // Eğer istek bir API isteği değilse index.html gönder
    if (!req.path.startsWith('/api')) {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).send("Hata: dist/index.html bulunamadı! Lütfen build işleminin başarılı olduğundan emin olun.");
      }
    }
  });
} else {
  // Geliştirme modu (AI Studio için)
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (id SERIAL PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, logo_url TEXT, primary_color TEXT DEFAULT '#4f46e5', subscription_end DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, store_id INTEGER NOT NULL, barcode TEXT NOT NULL, name TEXT NOT NULL, price REAL NOT NULL, currency TEXT DEFAULT 'TRY', description TEXT, UNIQUE(store_id, barcode));
      CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, store_id INTEGER, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL);
    `);
    console.log("✅ Veritabanı tabloları hazır.");
  } finally { client.release(); }
}

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Sunucu port ${PORT} üzerinde çalışıyor.`);
  console.log(`📂 Statik dosyalar şuradan aranıyor: ${distPath}`);
  try { await initDb(); } catch (e) { console.error("❌ DB Hatası:", e.message); }
});
