import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first"); // Supabase IPv6 fix

import express from "express";
import pkg from 'pg';
const { Pool } = pkg;
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
const distPath = path.resolve(process.cwd(), "dist");

app.use(express.json());

// İstek Günlüğü (Render loglarında ne olup bittiğini görmek için)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Veritabanı Bağlantısı
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- API ROTALARI ---
app.get("/api/health", (req, res) => res.send("OK"));

app.get("/api/debug", (req, res) => {
  res.json({
    status: "running",
    env: process.env.NODE_ENV,
    distPath: distPath,
    distExists: fs.existsSync(distPath),
    files: fs.existsSync(distPath) ? fs.readdirSync(distPath) : "dist not found"
  });
});

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

// --- FRONTEND SERVİSİ ---
// Statik dosyaları servis et (assets, resimler vb.)
app.use(express.static(distPath));

// Catch-all: Geri kalan her şey için index.html gönder (SPA desteği)
app.get("*", (req, res) => {
  if (req.url.startsWith("/api")) return res.status(404).json({ error: "API not found" });
  
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Sistem Hazırlanıyor... Lütfen birkaç dakika sonra sayfayı yenileyin. (dist/index.html bulunamadı)");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Sunucu port ${PORT} üzerinde başarıyla başlatıldı.`);
  console.log(`📂 Statik yol: ${distPath}`);
  pool.query("SELECT 1").then(() => console.log("✅ DB Bağlantısı Tamam.")).catch(e => console.error("❌ DB Hatası:", e.message));
});
