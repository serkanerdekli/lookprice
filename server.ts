import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pkg from 'pg';
const { Pool } = pkg;
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "lookprice_secret_fallback";

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database Initialization
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#4f46e5',
        address TEXT,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        admin_email TEXT UNIQUE,
        admin_password TEXT,
        subscription_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        barcode TEXT NOT NULL,
        name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'TRY',
        description TEXT,
        UNIQUE(store_id, barcode)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create SuperAdmin if not exists
    const superAdminEmail = 'admin@lookprice.com';
    const existingAdmin = await client.query('SELECT * FROM users WHERE email = $1', [superAdminEmail]);
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
        [superAdminEmail, hashedPassword, 'superadmin']
      );
    }

    await client.query('COMMIT');
    console.log("PostgreSQL Database initialized successfully");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Database initialization error:", e);
  } finally {
    client.release();
  }
};

initDb();

// --- Auth Middleware ---
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

// --- API Routes ---

// Public: Get Store Info
app.get("/api/public/store/:slug", async (req, res) => {
  try {
    const result = await pool.query('SELECT name, logo_url, primary_color, slug FROM stores WHERE slug = $1', [req.params.slug]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Public: Scan Product
app.get("/api/public/scan/:slug/:barcode", async (req, res) => {
  try {
    const storeRes = await pool.query('SELECT id, name, logo_url, primary_color FROM stores WHERE slug = $1', [req.params.slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    
    const store = storeRes.rows[0];
    const productRes = await pool.query(
      'SELECT * FROM products WHERE store_id = $1 AND barcode = $2',
      [store.id, req.params.barcode]
    );

    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: "Product not found", store });
    }

    const product = productRes.rows[0];
    await pool.query(
      'INSERT INTO scan_logs (store_id, product_id) VALUES ($1, $2)',
      [store.id, product.id]
    );

    res.json({ ...product, store });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Auth: Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, store_id: user.store_id }, JWT_SECRET);
    res.json({ token, user: { email: user.email, role: user.role, store_id: user.store_id } });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Get Stores
app.get("/api/admin/stores", authenticate, async (req: any, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Forbidden" });
  try {
    const result = await pool.query('SELECT * FROM stores ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Create Store
app.post("/api/admin/stores", authenticate, async (req: any, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Forbidden" });
  const { name, slug, admin_email, admin_password, subscription_end, address, contact_person, phone, email } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const storeRes = await client.query(
      'INSERT INTO stores (name, slug, admin_email, admin_password, subscription_end, address, contact_person, phone, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [name, slug, admin_email, admin_password, subscription_end, address, contact_person, phone, email]
    );
    const storeId = storeRes.rows[0].id;
    const hashedPassword = await bcrypt.hash(admin_password, 10);
    await client.query(
      'INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)',
      [storeId, admin_email, hashedPassword, 'storeadmin']
    );
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: "Failed to create store" });
  } finally {
    client.release();
  }
});

// Admin: Update Store
app.put("/api/admin/stores/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Forbidden" });
  const { name, slug, address, contact_person, phone, email, subscription_end } = req.body;
  try {
    await pool.query(
      'UPDATE stores SET name = $1, slug = $2, address = $3, contact_person = $4, phone = $5, email = $6, subscription_end = $7 WHERE id = $8',
      [name, slug, address, contact_person, phone, email, subscription_end, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Bulk Subscription
app.post("/api/admin/stores/bulk-subscription", authenticate, async (req: any, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Forbidden" });
  const { storeIds, days } = req.body;
  try {
    await pool.query(
      'UPDATE stores SET subscription_end = subscription_end + ($1 || \' days\')::INTERVAL WHERE id = ANY($2)',
      [days, storeIds]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: System Stats
app.get("/api/admin/stats", authenticate, async (req: any, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Forbidden" });
  try {
    const totalStores = await pool.query('SELECT COUNT(*) FROM stores');
    const activeStores = await pool.query('SELECT COUNT(*) FROM stores WHERE subscription_end > NOW()');
    const totalScans = await pool.query('SELECT COUNT(*) FROM scan_logs');
    const scans24h = await pool.query('SELECT COUNT(*) FROM scan_logs WHERE created_at > NOW() - INTERVAL \'1 day\'');
    
    res.json({
      totalStores: parseInt(totalStores.rows[0].count),
      activeStores: parseInt(activeStores.rows[0].count),
      totalScans: parseInt(totalScans.rows[0].count),
      scansLast24h: parseInt(scans24h.rows[0].count)
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Store: Get Products
app.get("/api/store/products", authenticate, async (req: any, res) => {
  const storeId = req.user.role === 'superadmin' ? req.query.storeId : req.user.store_id;
  try {
    const result = await pool.query('SELECT * FROM products WHERE store_id = $1 ORDER BY name ASC', [storeId]);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Store: Add Product
app.post("/api/store/products", authenticate, async (req: any, res) => {
  if (req.user.role === 'viewer') return res.status(403).json({ error: "Forbidden" });
  const storeId = req.user.role === 'superadmin' ? req.body.storeId : req.user.store_id;
  const { barcode, name, price, currency, description } = req.body;
  try {
    await pool.query(
      'INSERT INTO products (store_id, barcode, name, price, currency, description) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (store_id, barcode) DO UPDATE SET name = $3, price = $4, currency = $5, description = $6',
      [storeId, barcode, name, price, currency, description]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Store: Update Product
app.put("/api/store/products/:id", authenticate, async (req: any, res) => {
  if (req.user.role === 'viewer') return res.status(403).json({ error: "Forbidden" });
  const storeId = req.user.role === 'superadmin' ? req.body.storeId : req.user.store_id;
  const { barcode, name, price, currency, description } = req.body;
  try {
    await pool.query(
      'UPDATE products SET barcode = $1, name = $2, price = $3, currency = $4, description = $5 WHERE id = $6 AND store_id = $7',
      [barcode, name, price, currency, description, req.params.id, storeId]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Store: Delete Product
app.delete("/api/store/products/:id", authenticate, async (req: any, res) => {
  if (req.user.role === 'viewer' || req.user.role === 'editor') return res.status(403).json({ error: "Forbidden" });
  const storeId = req.user.role === 'superadmin' ? req.query.storeId : req.user.store_id;
  try {
    if (req.params.id === 'all') {
      await pool.query('DELETE FROM products WHERE store_id = $1', [storeId]);
    } else {
      await pool.query('DELETE FROM products WHERE id = $1 AND store_id = $2', [req.params.id, storeId]);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Store: Analytics
app.get("/api/store/analytics", authenticate, async (req: any, res) => {
  const storeId = req.user.role === 'superadmin' ? req.query.storeId : req.user.store_id;
  try {
    const totalScans = await pool.query('SELECT COUNT(*) FROM scan_logs WHERE store_id = $1', [storeId]);
    
    const scansByDay = await pool.query(`
      WITH days AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::DATE as date
      )
      SELECT TO_CHAR(days.date, 'DD Mon') as date, COUNT(scan_logs.id) as count
      FROM days
      LEFT JOIN scan_logs ON DATE(scan_logs.created_at) = days.date AND scan_logs.store_id = $1
      GROUP BY days.date
      ORDER BY days.date ASC
    `, [storeId]);

    const topProducts = await pool.query(`
      SELECT p.name, p.barcode, COUNT(s.id) as count
      FROM products p
      JOIN scan_logs s ON s.product_id = p.id
      WHERE p.store_id = $1
      GROUP BY p.id
      ORDER BY count DESC
      LIMIT 5
    `, [storeId]);

    const recentScans = await pool.query(`
      SELECT p.name, p.barcode, s.created_at
      FROM scan_logs s
      JOIN products p ON s.product_id = p.id
      WHERE s.store_id = $1
      ORDER BY s.created_at DESC
      LIMIT 10
    `, [storeId]);

    res.json({
      totalScans: totalScans.rows[0],
      scansByDay: scansByDay.rows,
      topProducts: topProducts.rows,
      recentScans: recentScans.rows
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Store: Branding
app.post("/api/store/branding", authenticate, async (req: any, res) => {
  if (req.user.role === 'viewer' || req.user.role === 'editor') return res.status(403).json({ error: "Forbidden" });
  const storeId = req.user.role === 'superadmin' ? req.body.storeId : req.user.store_id;
  const { logo_url, primary_color } = req.body;
  try {
    await pool.query(
      'UPDATE stores SET logo_url = $1, primary_color = $2 WHERE id = $3',
      [logo_url, primary_color, storeId]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Store: Users Management
app.get("/api/store/users", authenticate, async (req: any, res) => {
  const storeId = req.user.role === 'superadmin' ? req.query.storeId : req.user.store_id;
  if (!storeId && req.user.role !== 'superadmin') return res.status(403).json({ error: "Forbidden" });
  try {
    const result = await pool.query('SELECT id, email, role FROM users WHERE store_id = $1', [storeId]);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/store/users", authenticate, async (req: any, res) => {
  const storeId = req.user.role === 'superadmin' ? req.body.storeId : req.user.store_id;
  if (!storeId && req.user.role !== 'superadmin') return res.status(403).json({ error: "Forbidden" });
  const { email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)',
      [storeId, email, hashedPassword, role]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/store/users/:id", authenticate, async (req: any, res) => {
  const storeId = req.user.role === 'superadmin' ? req.query.storeId : req.user.store_id;
  try {
    await pool.query('DELETE FROM users WHERE id = $1 AND store_id = $2 AND role != \'storeadmin\'', [req.params.id, storeId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/store/info", authenticate, async (req: any, res) => {
  const storeId = req.user.role === 'superadmin' ? req.query.storeId : req.user.store_id;
  try {
    const result = await pool.query('SELECT name, slug, logo_url, primary_color FROM stores WHERE id = $1', [storeId]);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Store: Import
const upload = multer({ dest: 'uploads/' });
app.post("/api/store/import", authenticate, upload.single('file'), async (req: any, res) => {
  if (req.user.role === 'viewer') return res.status(403).json({ error: "Forbidden" });
  const storeId = req.user.role === 'superadmin' ? req.body.storeId : req.user.store_id;
  const mapping = JSON.parse(req.body.mapping);
  
  // Note: In a real production app, we'd use a library like 'xlsx' on the server too.
  // For this demo, we assume the client sends the data or we handle it here.
  // Since we are using Supabase, we can use a transaction for bulk insert.
  res.json({ success: true, count: 0, message: "Import logic should be implemented based on file type" });
});

// --- Vite Integration ---
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
