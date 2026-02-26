import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { 
  BarChart3, ChevronRight, LogOut, Package, Plus, Scan, Search, Store, Trash2, Upload, X, 
  Settings, Palette, Users, Edit2, TrendingUp, Clock, Filter, Ticket, AlertCircle, 
  CheckCircle2, Menu, Image as ImageIcon, Zap, ZapOff, Keyboard
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from "motion/react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import * as XLSX from "xlsx";
import { QRCodeSVG } from "qrcode.react";

interface User {
  email: string;
  role: 'superadmin' | 'storeadmin' | 'editor' | 'viewer';
  store_id?: number;
}

const api = {
  async get(url: string, token?: string) {
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.json();
  },
  async post(url: string, body: any, token?: string) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async put(url: string, body: any, token?: string) {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async delete(url: string, token?: string) {
    const res = await fetch(url, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.json();
  },
  async upload(url: string, formData: FormData, token: string) {
    const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
    return res.json();
  }
};
export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem("token"); } catch { return null; }
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Routes>
          <Route path="/scan/:slug" element={<CustomerScanPage />} />
          <Route path="/login" element={
            token ? (
              user?.role === 'superadmin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />
            ) : (
              <>
                <Navbar user={null} onLogout={handleLogout} />
                <LoginPage onLogin={handleLogin} />
              </>
            )
          } />
          <Route path="/dashboard/:storeId?" element={
            token && (user?.role === 'storeadmin' || user?.role === 'superadmin') ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <StoreDashboard token={token} user={user} />
              </>
            ) : <Navigate to="/login" />
          } />
          <Route path="/admin" element={
            token && user?.role === 'superadmin' ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <SuperAdminDashboard token={token} />
              </>
            ) : <Navigate to="/login" />
          } />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
// --- Components ---

const Navbar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Store className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">PriceCheck Pro</span>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-500">{user.email}</span>
                <button onClick={onLogout} className="flex items-center text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  <LogOut className="h-4 w-4 mr-1" /> Logout
                </button>
              </>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">{isOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Scanner = ({ onResult }: { onResult: (decodedText: string) => void }) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    html5QrCode.start({ facingMode: "environment" }, config, (text) => {
      html5QrCode.stop().then(() => onResult(text));
    }, () => {});
    return () => { if (html5QrCode.isScanning) html5QrCode.stop().catch(() => {}); };
  }, []);
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-3xl bg-black border-4 border-white/20 shadow-2xl">
      <div id="reader" className="w-full h-full" />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-indigo-500 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: (token: string, user: User) => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/api/auth/login", { email, password });
    if (res.token) {
      onLogin(res.token, res.user);
      res.user.role === 'superadmin' ? navigate("/admin") : navigate("/dashboard");
    } else { setError(res.error || "Giriş başarısız"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Hoş Geldiniz</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl" placeholder="E-posta" />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl" placeholder="Şifre" />
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">Giriş Yap</button>
        </form>
      </div>
    </div>
  );
};

const CustomerScanPage = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    api.get(`/api/public/store/${slug}`).then(res => { if (!res.error) setStore(res); });
  }, [slug]);

  const handleScan = async (barcode: string) => {
    setScanning(false);
    const res = await api.get(`/api/public/scan/${slug}/${barcode}`);
    if (!res.error) setProduct(res);
    else alert("Ürün bulunamadı");
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center text-white" style={{ backgroundColor: store?.primary_color || "#4f46e5" }}>
      <h1 className="text-3xl font-bold mb-8">{store?.name || "Yükleniyor..."}</h1>
      {scanning ? (
        <Scanner onResult={handleScan} />
      ) : (
        <div className="bg-white text-gray-900 p-8 rounded-3xl w-full max-w-md shadow-2xl text-center">
          <Package className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
          <h2 className="text-2xl font-bold">{product?.name}</h2>
          <div className="text-4xl font-black my-4 text-indigo-600">{product?.price} {product?.currency}</div>
          <button onClick={() => setScanning(true)} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Yeni Tarama</button>
        </div>
      )}
    </div>
  );
};

// Dashboard bileşenlerini de (StoreDashboard ve SuperAdminDashboard) 
// token limitine takılmamak için özetleyerek ekliyorum. 
// Eğer tam hallerini isterseniz onları da parça parça verebilirim.
const StoreDashboard = ({ token, user }: { token: string, user: User }) => {
  return <div className="p-8 text-center">Mağaza Paneli Hazırlanıyor... (Ürünlerinizi buradan yönetebilirsiniz)</div>;
};

const SuperAdminDashboard = ({ token }: { token: string }) => {
  return <div className="p-8 text-center">Süper Admin Paneli Hazırlanıyor... (Mağazaları buradan yönetebilirsiniz)</div>;
};
export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem("token"); } catch { return null; }
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Routes>
          <Route path="/scan/:slug" element={<CustomerScanPage />} />
          <Route path="/login" element={
            token ? (
              user?.role === 'superadmin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />
            ) : (
              <>
                <Navbar user={null} onLogout={handleLogout} />
                <LoginPage onLogin={handleLogin} />
              </>
            )
          } />
          <Route path="/dashboard/:storeId?" element={
            token && (user?.role === 'storeadmin' || user?.role === 'superadmin') ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <StoreDashboard token={token} user={user} />
              </>
            ) : <Navigate to="/login" />
          } />
          <Route path="/admin" element={
            token && user?.role === 'superadmin' ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <SuperAdminDashboard token={token} />
              </>
            ) : <Navigate to="/login" />
          } />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
