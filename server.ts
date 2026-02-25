import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first"); // Supabase IPv6 sorununu çözer

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
const rootDir = process.cwd();
const distPath = path.join(rootDir, "dist");

app.use(express.json());

// --- VERİTABANI BAĞLANTISI ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// --- HATA AYIKLAMA ROTASI (Sorun olursa buraya bakacağız) ---
app.get("/api/debug", (req, res) => {
  res.json({
    env: process.env.NODE_ENV,
    distPath: distPath,
    distExists: fs.existsSync(distPath),
    filesInDist: fs.existsSync(distPath) ? fs.readdirSync(distPath) : []
  });
});

// --- API ROTALARI ---
app.get("/api/public/store/:slug", async (req, res) => {
  try {
    const result = await pool.query("SELECT name, logo_url, primary_color, slug FROM stores WHERE slug = $1", [req.params.slug]);
    res.json(result.rows[0] || { error: "Store not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userRes.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid" });
    const token = jwt.sign({ id: user.id, role: user.role, store_id: user.store_id }, process.env.JWT_SECRET || "secret");
    res.json({ token, user: { email: user.email, role: user.role, store_id: user.store_id } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- FRONTEND SERVİSİ (Beyaz Sayfa Çözümü) ---
if (process.env.NODE_ENV === "production") {
  // 1. Statik dosyaları (js, css) servis et
  app.use(express.static(distPath));

  // 2. Geri kalan her şeyi dist/index.html'e yönlendir
  app.get("*", (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({error: "API not found"});
    
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send("Kritik Hata: dist/index.html bulunamadı! Lütfen build işlemini kontrol edin.");
    }
  });
} else {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Sunucu port ${PORT} üzerinde aktif.`);
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("✅ Veritabanı bağlantısı başarılı.");
  } catch (e) { console.error("❌ DB Hatası:", e.message); }
});
