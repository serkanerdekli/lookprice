import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import * as XLSX from "xlsx";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("pricecheck.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scan_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('superadmin', 'storeadmin', 'editor', 'viewer')) NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    barcode TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'TRY',
    description TEXT,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    UNIQUE(store_id, barcode)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );
`);

// Migration: Add logo_url and primary_color to stores if they don't exist
try {
  db.prepare("ALTER TABLE stores ADD COLUMN logo_url TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE stores ADD COLUMN primary_color TEXT DEFAULT '#4f46e5'").run();
} catch (e) {}

// Seed Super Admin if not exists
const adminEmail = "admin@pricecheck.com";
const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)").run(adminEmail, hashedPassword, "superadmin");
}

async function startServer() {
  const app = express();
  const PORT = 3000;
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
  app.get("/api/public/scan/:slug/:barcode", (req, res) => {
    const { slug, barcode } = req.params;
    const store = db.prepare("SELECT id, name, logo_url, primary_color FROM stores WHERE slug = ?").get(slug) as any;
    if (!store) return res.status(404).json({ error: "Store not found" });

    const product = db.prepare("SELECT * FROM products WHERE store_id = ? AND barcode = ?").get(store.id, barcode) as any;
    if (!product) return res.status(404).json({ error: "Product not found", store });

    // Log the scan
    db.prepare("INSERT INTO scan_logs (store_id, product_id) VALUES (?, ?)").run(store.id, product.id);

    res.json({ ...product, store });
  });

  // Public: Get Store Info (for branding on scan page load)
  app.get("/api/public/store/:slug", (req, res) => {
    const store = db.prepare("SELECT name, logo_url, primary_color FROM stores WHERE slug = ?").get(req.params.slug);
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  });

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, role: user.role, store_id: user.store_id }, JWT_SECRET);
    res.json({ token, user: { email: user.email, role: user.role, store_id: user.store_id } });
  });

  // SuperAdmin: Manage Stores
  app.get("/api/admin/stats", authenticate, (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    
    const stats = {
      totalStores: db.prepare("SELECT COUNT(*) as count FROM stores").get().count,
      activeStores: db.prepare("SELECT COUNT(*) as count FROM stores WHERE subscription_end > CURRENT_DATE").get().count,
      totalScans: db.prepare("SELECT COUNT(*) as count FROM scan_logs").get().count,
      scansLast24h: db.prepare("SELECT COUNT(*) as count FROM scan_logs WHERE created_at > DATETIME('now', '-1 day')").get().count
    };
    res.json(stats);
  });

  app.get("/api/admin/stores", authenticate, (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const stores = db.prepare(`
      SELECT s.*, u.email as admin_email 
      FROM stores s 
      LEFT JOIN users u ON s.id = u.store_id AND u.role = 'storeadmin'
    `).all();
    res.json(stores);
  });

  app.post("/api/admin/stores/bulk-subscription", authenticate, (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { storeIds, days } = req.body;
    if (!storeIds || !Array.isArray(storeIds) || !days) return res.status(400).json({ error: "Invalid data" });

    const transaction = db.transaction((ids) => {
      for (const id of ids) {
        db.prepare(`
          UPDATE stores 
          SET subscription_end = DATE(COALESCE(subscription_end, CURRENT_DATE), '+' || ? || ' days') 
          WHERE id = ?
        `).run(days, id);
      }
    });
    transaction(storeIds);
    res.json({ success: true });
  });

  app.post("/api/admin/stores", authenticate, (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { name, slug, address, contact_person, phone, email, subscription_end, admin_email, admin_password } = req.body;
    try {
      const info = db.prepare("INSERT INTO stores (name, slug, address, contact_person, phone, email, subscription_end) VALUES (?, ?, ?, ?, ?, ?, ?)").run(name, slug, address, contact_person, phone, email, subscription_end);
      const storeId = info.lastInsertRowid;
      const hashedPassword = bcrypt.hashSync(admin_password, 10);
      db.prepare("INSERT INTO users (store_id, email, password, role) VALUES (?, ?, ?, ?)").run(storeId, admin_email, hashedPassword, "storeadmin");
      res.json({ success: true, storeId });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/admin/stores/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { name, slug, address, contact_person, phone, email, subscription_end } = req.body;
    try {
      db.prepare(`
        UPDATE stores 
        SET name = ?, slug = ?, address = ?, contact_person = ?, phone = ?, email = ?, subscription_end = ? 
        WHERE id = ?
      `).run(name, slug, address, contact_person, phone, email, subscription_end, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // StoreAdmin: Manage Products
  app.get("/api/store/info", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });
    
    const store = db.prepare("SELECT * FROM stores WHERE id = ?").get(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  });

  app.post("/api/store/branding", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { logo_url, primary_color } = req.body;
    db.prepare("UPDATE stores SET logo_url = ?, primary_color = ? WHERE id = ?").run(logo_url, primary_color, storeId);
    res.json({ success: true });
  });

  app.get("/api/store/analytics", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const stats = {
      totalScans: db.prepare("SELECT COUNT(*) as count FROM scan_logs WHERE store_id = ?").get(storeId),
      scansByDay: db.prepare(`
        SELECT date, COALESCE(count, 0) as count FROM (
          SELECT DATE('now', '-' || (n.n) || ' days') as date
          FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) n
        ) d
        LEFT JOIN (
          SELECT DATE(created_at) as scan_date, COUNT(*) as count 
          FROM scan_logs 
          WHERE store_id = ? 
          GROUP BY DATE(created_at)
        ) s ON d.date = s.scan_date
        ORDER BY date ASC
      `).all(storeId),
      topProducts: db.prepare(`
        SELECT p.name, p.barcode, COUNT(l.id) as count 
        FROM scan_logs l 
        JOIN products p ON l.product_id = p.id 
        WHERE l.store_id = ? 
        GROUP BY l.product_id 
        ORDER BY count DESC 
        LIMIT 5
      `).all(storeId),
      recentScans: db.prepare(`
        SELECT p.name, p.barcode, l.created_at 
        FROM scan_logs l 
        JOIN products p ON l.product_id = p.id 
        WHERE l.store_id = ? 
        ORDER BY l.created_at DESC 
        LIMIT 10
      `).all(storeId)
    };
    res.json(stats);
  });

  app.get("/api/store/users", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const users = db.prepare("SELECT id, email, role FROM users WHERE store_id = ?").all(storeId);
    res.json(users);
  });

  app.post("/api/store/users", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { email, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      db.prepare("INSERT INTO users (store_id, email, password, role) VALUES (?, ?, ?, ?)").run(storeId, email, hashedPassword, role);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.delete("/api/store/users/:id", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    // Ensure user belongs to this store
    const user = db.prepare("SELECT * FROM users WHERE id = ? AND store_id = ?").get(req.params.id, storeId);
    if (!user) return res.status(404).json({ error: "User not found" });

    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/store/products", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const products = db.prepare("SELECT * FROM products WHERE store_id = ?").all(storeId);
    res.json(products);
  });

  app.post("/api/store/products", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { barcode, name, price, currency, description } = req.body;
    if (!barcode || !name || !price) return res.status(400).json({ error: "Missing fields" });
    try {
      db.prepare("INSERT OR REPLACE INTO products (store_id, barcode, name, price, currency, description) VALUES (?, ?, ?, ?, ?, ?)")
        .run(storeId, String(barcode), name, parseFloat(price), currency || 'TRY', description || '');
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/store/products/:id", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { id } = req.params;
    const { barcode, name, price, currency, description } = req.body;
    try {
      db.prepare("UPDATE products SET barcode = ?, name = ?, price = ?, currency = ?, description = ? WHERE id = ? AND store_id = ?")
        .run(String(barcode), name, parseFloat(price), currency || 'TRY', description || '', id, storeId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/store/products/all", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    db.prepare("DELETE FROM products WHERE store_id = ?").run(storeId);
    res.json({ success: true });
  });

  app.delete("/api/store/products/:id", authenticate, (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ? AND store_id = ?").run(id, storeId);
    res.json({ success: true });
  });

  // StoreAdmin: Import Data
  app.post("/api/store/import", authenticate, upload.single("file"), (req: any, res) => {
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
      // Try to handle Turkish characters in CSV files by specifying codepage if needed
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', codepage: 65001 }); // 65001 is UTF-8
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (data.length === 0) {
        return res.status(400).json({ error: "The uploaded file is empty" });
      }

      const insert = db.prepare("INSERT OR REPLACE INTO products (store_id, barcode, name, price, currency, description) VALUES (?, ?, ?, ?, ?, ?)");
      
      let successCount = 0;
      const transaction = db.transaction((items) => {
        for (const item of items) {
          const barcode = String(item[mapping.barcode] || "").trim();
          const name = String(item[mapping.name] || "").trim();
          const priceStr = String(item[mapping.price] || "0").replace(/[^0-9.,]/g, "").replace(",", ".");
          const price = parseFloat(priceStr);

          if (barcode && name && !isNaN(price)) {
            insert.run(
              req.user.store_id,
              barcode,
              name,
              price,
              item[mapping.currency] || 'TRY',
              item[mapping.description] || ''
            );
            successCount++;
          }
        }
      });

      transaction(data);
      fs.unlinkSync(req.file.path);
      res.json({ success: true, count: successCount, total: data.length });
    } catch (e: any) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(400).json({ error: e.message });
    }
  });

  // CRM: Tickets
  app.get("/api/tickets", authenticate, (req: any, res) => {
    let tickets;
    if (req.user.role === "superadmin") {
      tickets = db.prepare("SELECT t.*, s.name as store_name FROM tickets t JOIN stores s ON t.store_id = s.id").all();
    } else {
      tickets = db.prepare("SELECT * FROM tickets WHERE store_id = ?").all(req.user.store_id);
    }
    res.json(tickets);
  });

  app.post("/api/tickets", authenticate, (req: any, res) => {
    if (req.user.role !== "storeadmin") return res.status(403).json({ error: "Forbidden" });
    const { subject, message } = req.body;
    db.prepare("INSERT INTO tickets (store_id, subject, message) VALUES (?, ?, ?)").run(req.user.store_id, subject, message);
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
