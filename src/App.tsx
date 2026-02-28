import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  ChevronRight, 
  LogOut, 
  Package, 
  Plus, 
  Scan, 
  Search, 
  Store, 
  Trash2, 
  Upload, 
  X, 
  Settings, 
  Palette, 
  Users, 
  Edit2,
  TrendingUp,
  Clock,
  Filter,
  Ticket,
  AlertCircle,
  CheckCircle2,
  Menu,
  Image as ImageIcon,
  Zap,
  ZapOff,
  Keyboard,
  Lock,
  Play,
  Phone,
  Mail,
  MessageCircle,
  Instagram
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from "motion/react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import * as XLSX from "xlsx";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "./components/Logo";

// --- Types ---
interface User {
  email: string;
  role: 'superadmin' | 'storeadmin' | 'editor' | 'viewer';
  store_id?: number;
}

// --- API Helper ---
const api = {
  async get(url: string, token?: string) {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.json();
  },
  async post(url: string, body: any, token?: string) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async put(url: string, body: any, token?: string) {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async delete(url: string, token?: string) {
    const res = await fetch(url, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.json();
  },
  async upload(url: string, formData: FormData, token: string) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return res.json();
  }
};

// --- Components ---

const Navbar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <Logo size={32} className="text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">Look<span className="text-indigo-600">Price</span></span>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {!user && (
              <button 
                onClick={() => navigate("/login")}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                Giriş Yap
              </button>
            )}
            {user && (
              <>
                <span className="text-sm text-gray-500">{user.email}</span>
                <button 
                  onClick={onLogout}
                  className="flex items-center text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-1" /> Logout
                </button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-3 space-y-1"
          >
            {!user && (
              <button 
                onClick={() => {
                  navigate("/login");
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-indigo-600 font-bold"
              >
                Giriş Yap
              </button>
            )}
            {user && (
              <button 
                onClick={onLogout}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-indigo-600"
              >
                Logout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Scanner = ({ onResult }: { onResult: (decodedText: string) => void }) => {
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const startScanner = async (instance: Html5Qrcode) => {
    if (isStarting) return;
    
    // Eğer zaten tarama yapılıyorsa önce durdur
    if (instance.isScanning) {
      try { await instance.stop(); } catch (e) { console.error(e); }
    }

    setIsStarting(true);
    setError(null);
    try {
      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: true,
      };

      // En uyumlu yöntem: Direkt facingMode objesi ile başlat
      // Obje kirliliğini önlemek için temiz bir kopya oluşturuyoruz
      const constraints = { facingMode: "environment" };

      await instance.start(
        constraints,
        config,
        (decodedText) => {
          if (navigator.vibrate) navigator.vibrate(100);
          instance.stop().then(() => {
            onResult(decodedText);
          }).catch(() => {
            onResult(decodedText);
          });
        },
        () => {} // Kare hatalarını görmezden gel
      );

      // Fener (Torch) kontrolü - Ayrı bir try-catch içinde, ana akışı bozmasın
      try {
        const track = (instance as any).getRunningTrack();
        if (track && typeof track.getCapabilities === 'function') {
          const capabilities = track.getCapabilities();
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
          }
        }
      } catch (torchErr) {
        console.warn("Fener kontrolü desteklenmiyor:", torchErr);
      }
      
    } catch (err: any) {
      console.error("Scanner start error:", err);
      
      // İlk yöntem başarısız olursa (facingMode hatası), kamera listesini dene
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('arka'));
          await instance.start(
            backCam ? backCam.id : cameras[0].id,
            { fps: 15, qrbox: 250 },
            (text) => onResult(text),
            () => {}
          );
          return; // Başarılı olduysa çık
        }
      } catch (fallbackErr) {
        console.error("Yedek başlatma hatası:", fallbackErr);
      }

      setError(`Kamera başlatılamadı: ${err.message || "Bilinmeyen hata"}`);
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    setScannerInstance(html5QrCode);
    
    const timer = setTimeout(() => startScanner(html5QrCode), 1000);

    return () => {
      clearTimeout(timer);
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, []);

  const toggleTorch = async () => {
    if (!scannerInstance || !hasTorch) return;
    try {
      const newState = !isTorchOn;
      await scannerInstance.applyVideoConstraints({
        advanced: [{ torch: newState }] as any
      });
      setIsTorchOn(newState);
    } catch (err) {
      console.error("Torch error:", err);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-3xl border-4 border-white/20 shadow-2xl bg-black">
      <div id="reader" className="w-full h-full [&_video]:object-cover" />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-sm text-white">{error}</p>
            <button 
              onClick={() => scannerInstance && startScanner(scannerInstance)}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg font-bold text-xs"
              disabled={isStarting}
            >
              {isStarting ? "Başlatılıyor..." : "Yeniden Dene"}
            </button>
          </div>
        </div>
      )}

      {/* Viewfinder Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        <div className="w-[85%] h-[40%] border-2 border-white/20 rounded-2xl relative">
          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl" />
          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl" />
          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl" />
          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl" />
          
          {/* Scanning line animation */}
          <motion.div 
            animate={{ top: ["10%", "90%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-4 right-4 h-1 bg-indigo-500 shadow-[0_0_25px_rgba(99,102,241,1)] rounded-full"
          />
        </div>
        
        <div className="mt-12 px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/20 shadow-xl">
          <p className="text-white text-[10px] font-black tracking-[0.2em] uppercase flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            Barkod Hizalayın
          </p>
        </div>
      </div>

      {/* Torch Control */}
      {hasTorch && (
        <button 
          onClick={toggleTorch}
          className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90 z-10"
        >
          {isTorchOn ? <ZapOff className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
        </button>
      )}
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: "", storeName: "", phone: "", email: "", notes: "" });
  const [demoStatus, setDemoStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    if (location.state?.openDemo) {
      setShowDemoModal(true);
      // Clear state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoStatus({ type: "loading", text: "Gönderiliyor..." });
    const res = await api.post("/api/public/demo-request", demoForm);
    if (res.success) {
      setDemoStatus({ type: "success", text: "Talebiniz alındı! En kısa sürede sizinle iletişime geçeceğiz." });
      setDemoForm({ name: "", storeName: "", phone: "", email: "", notes: "" });
      setTimeout(() => {
        setShowDemoModal(false);
        setDemoStatus({ type: "", text: "" });
      }, 3000);
    } else {
      setDemoStatus({ type: "error", text: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  };
  
  const references = [
    { name: "Migros", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Migros_logo.svg/1200px-Migros_logo.svg.png" },
    { name: "CarrefourSA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/CarrefourSA_logo.svg/2560px-CarrefourSA_logo.svg.png" },
    { name: "BİM", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Bim_logo.svg/1200px-Bim_logo.svg.png" },
    { name: "A101", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/A101_logo.svg/1200px-A101_logo.svg.png" },
    { name: "Şok Market", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/%C5%9Eok_Market_logo.svg/1200px-%C5%9Eok_Market_logo.svg.png" }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-indigo-600">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-center mb-6">
                <Logo size={80} className="text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                LookPrice <span className="text-indigo-200">ile Tanışın</span>
              </h1>
              <p className="max-w-2xl mx-auto text-xl text-indigo-100 mb-10">
                Müşterileriniz fiyat sormaktan yorulmasın. QR kod teknolojisi ile mağazanızdaki tüm ürünlerin güncel fiyatlarını anında gösterin.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg shadow-xl hover:bg-indigo-50 transition-all transform hover:-translate-y-1"
                >
                  Ücretsiz Demo Talebi
                </button>
                <button 
                  onClick={() => setShowVideoModal(true)}
                  className="px-8 py-4 bg-indigo-500 text-white border border-indigo-400 rounded-2xl font-bold text-lg hover:bg-indigo-400 transition-all flex items-center justify-center"
                >
                  <Play className="h-5 w-5 mr-2" /> Demo İzleyin
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Neden LookPrice?</h2>
            <p className="mt-4 text-gray-600">Mağaza operasyonlarınızı dijitalleştirin, müşteri memnuniyetini artırın.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Scan className="text-indigo-600 h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Hızlı Tarama</h3>
              <p className="text-gray-600 leading-relaxed">
                Müşterileriniz herhangi bir uygulama indirmeden, sadece telefonlarının kamerasıyla QR kodları taratarak fiyatlara ulaşır.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="text-emerald-600 h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Anlık Güncelleme</h3>
              <p className="text-gray-600 leading-relaxed">
                Fiyat değişimlerini saniyeler içinde tüm mağazaya yansıtın. Kağıt etiket değiştirme derdine son verin.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="text-purple-600 h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Detaylı Analiz</h3>
              <p className="text-gray-600 leading-relaxed">
                Hangi ürünlerin daha çok merak edildiğini, hangi saatlerde yoğunluk olduğunu gelişmiş raporlarla takip edin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* References Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4">Referanslarımız</h3>
            <h2 className="text-3xl font-bold text-gray-900">Bize Güvenen Markalar</h2>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {references.map((ref, idx) => (
              <img 
                key={idx} 
                src={ref.logo} 
                alt={ref.name} 
                className="h-12 w-auto object-contain max-w-[150px]" 
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-900 rounded-[3rem] p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Hemen LookPrice Dünyasına Katılın</h2>
              <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
                Mağazanızın geleceğini bugünden inşa edin. Ücretsiz demo için bizimle iletişime geçin.
              </p>
              <button 
                onClick={() => navigate("/login")}
                className="px-10 py-4 bg-white text-indigo-900 rounded-2xl font-bold text-lg shadow-2xl hover:bg-indigo-50 transition-all"
              >
                Ücretsiz Deneyin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start mb-6">
                <Logo size={40} className="text-white" />
                <span className="ml-2 text-2xl font-bold text-white">Look<span className="text-indigo-500">Price</span></span>
              </div>
              <p className="max-w-xs mx-auto md:mx-0">
                Mağazanızın dijital dönüşüm ortağı. QR kod ile akıllı fiyatlandırma çözümleri.
              </p>
            </div>
            <div className="text-center">
              <h4 className="text-white font-bold mb-6">İletişim</h4>
              <ul className="space-y-4">
                <li className="flex items-center justify-center">
                  <Phone className="h-4 w-4 mr-2 text-indigo-500" />
                  <a href="tel:+905488902309" className="hover:text-white transition-colors">+90 548 890 23 09</a>
                </li>
                <li className="flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 mr-2 text-emerald-500" />
                  <a href="https://wa.me/905488902309" target="_blank" className="hover:text-white transition-colors">WhatsApp Destek</a>
                </li>
                <li className="flex items-center justify-center">
                  <Mail className="h-4 w-4 mr-2 text-indigo-500" />
                  <a href="mailto:lookprice.me@gmail.com" className="hover:text-white transition-colors">lookprice.me@gmail.com</a>
                </li>
                <li className="flex items-center justify-center">
                  <Instagram className="h-4 w-4 mr-2 text-pink-500" />
                  <a href="https://www.instagram.com/lookprice.me/" target="_blank" className="hover:text-white transition-colors">lookprice.me</a>
                </li>
              </ul>
            </div>
            <div className="text-center md:text-right flex flex-col items-center md:items-end">
              <h4 className="text-white font-bold mb-6">Instagram QR</h4>
              <div className="bg-white p-2 rounded-2xl w-32 h-32 flex items-center justify-center shadow-lg">
                <QRCodeSVG 
                  value="https://www.instagram.com/lookprice.me/" 
                  size={110}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
            <div className="text-center md:text-right">
              <h4 className="text-white font-bold mb-6">Hızlı Menü</h4>
              <ul className="space-y-4">
                <li><button onClick={() => navigate("/login")} className="hover:text-white transition-colors">Giriş Yap</button></li>
                <li><button onClick={() => setShowDemoModal(true)} className="hover:text-white transition-colors">Demo Talebi</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>© 2026 LookPrice. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      {/* Demo Request Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 relative"
            >
              <button onClick={() => setShowDemoModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ücretsiz Demo Talebi</h2>
              <p className="text-gray-500 mb-8">Bilgilerinizi bırakın, sizi arayalım ve LookPrice'ı anlatalım.</p>
              
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                {demoStatus.text && (
                  <div className={`p-4 rounded-xl text-sm ${demoStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'}`}>
                    {demoStatus.text}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ad Soyad</label>
                  <input 
                    required 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={demoForm.name}
                    onChange={e => setDemoForm({...demoForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mağaza Adı</label>
                  <input 
                    required 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={demoForm.storeName}
                    onChange={e => setDemoForm({...demoForm, storeName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Telefon</label>
                  <input 
                    required 
                    type="tel"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={demoForm.phone}
                    onChange={e => setDemoForm({...demoForm, phone: e.target.value})}
                    placeholder="+90"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Notlarınız (Opsiyonel)</label>
                  <textarea 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                    rows={3}
                    value={demoForm.notes}
                    onChange={e => setDemoForm({...demoForm, notes: e.target.value})}
                    placeholder="Eklemek istediğiniz bir not var mı?"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={demoStatus.type === 'loading'}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {demoStatus.type === 'loading' ? 'Gönderiliyor...' : 'Talebi Gönder'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[70] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-5xl w-full aspect-video bg-black rounded-3xl overflow-hidden relative shadow-2xl"
            >
              <button 
                onClick={() => setShowVideoModal(false)} 
                className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-md transition-all"
              >
                <X />
              </button>
              <div className="w-full h-full flex items-center justify-center text-white">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/9zJzDUso6Uk?autoplay=1" 
                  title="LookPrice Demo Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Pages ---

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await api.post("/api/auth/forgot-password", { email });
    setLoading(false);
    if (res.success) {
      setMessage(res.message);
      // For demo purposes, we might want to show the token if it's returned
      if (res.debug_token) {
        console.log("Debug Token:", res.debug_token);
      }
    } else {
      setError(res.error || "İşlem başarısız");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={64} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Şifremi Unuttum</h2>
          <p className="mt-2 text-gray-600">E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-2" /> {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg flex items-center text-sm">
              <CheckCircle2 className="h-4 w-4 mr-2" /> {message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">E-posta Adresi</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="admin@example.com"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
          </button>
          <div className="text-center">
            <button 
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-indigo-600 hover:underline font-medium"
            >
              Giriş Sayfasına Dön
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Şifreler eşleşmiyor");
    }
    setLoading(true);
    setError("");
    const res = await api.post("/api/auth/reset-password", { token, newPassword: password });
    setLoading(false);
    if (res.success) {
      setMessage("Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.");
      setTimeout(() => navigate("/login"), 3000);
    } else {
      setError(res.error || "İşlem başarısız");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={64} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Yeni Şifre Oluştur</h2>
          <p className="mt-2 text-gray-600">Lütfen yeni şifrenizi belirleyin.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-2" /> {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg flex items-center text-sm">
              <CheckCircle2 className="h-4 w-4 mr-2" /> {message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Yeni Şifre</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre Tekrar</label>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !!message}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </motion.div>
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
      if (res.user.role === 'superadmin') navigate("/admin");
      else navigate("/dashboard");
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={64} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Hoş Geldiniz</h2>
          <p className="mt-2 text-gray-600">Mağazanızı yönetmek için giriş yapın</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-2" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
            <div className="mt-2 text-right">
              <button 
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                Şifremi Unuttum?
              </button>
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Sign In
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Henüz bir hesabınız yok mu?{" "}
              <button 
                type="button"
                onClick={() => navigate("/", { state: { openDemo: true } })}
                className="text-indigo-600 font-bold hover:underline"
              >
                Kayıt Olun
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const CustomerScanPage = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    fetchStore();
  }, [slug]);

  const fetchStore = async () => {
    const res = await api.get(`/api/public/store/${slug}`);
    if (!res.error) setStore(res);
  };

  const handleScan = async (barcode: string) => {
    setScanning(false);
    setLoading(true);
    setError("");
    setShowManual(false);
    
    try {
      const res = await api.get(`/api/public/scan/${slug}/${barcode}`);
      if (res.error) {
        setError(res.error);
        if (res.store) setStore(res.store);
      } else {
        setProduct(res);
        if (res.store) setStore(res.store);
      }
    } catch (e) {
      setError("Sunucu hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleScan(manualBarcode.trim());
    }
  };

  const primaryColor = store?.primary_color || "#4f46e5";

  return (
    <div className="min-h-screen text-white p-6 flex flex-col items-center transition-colors duration-500 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
      {/* Background Image Overlay */}
      {store?.background_image_url && (
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${store.background_image_url})` }}
        />
      )}
      
      <div className="w-full max-w-md text-center mb-8 relative z-10">
        {store?.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="h-16 mx-auto mb-4 object-contain" referrerPolicy="no-referrer" />
        ) : (
          <Logo size={64} className="mx-auto mb-4 opacity-80 text-white" />
        )}
        <h1 className="text-3xl font-bold mb-2">{store?.name || "Price Checker"}</h1>
        <p className="opacity-80">Ürün barkodunu tarayarak detayları görün</p>
      </div>

      <div className="w-full max-w-md relative z-10">
        {scanning ? (
          <div className="w-full max-w-md space-y-6">
            <Scanner onResult={handleScan} />
            
            <div className="flex flex-col items-center space-y-4">
              <button 
                onClick={() => setShowManual(!showManual)}
                className="flex items-center text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
              >
                <Keyboard className="h-4 w-4 mr-2" /> 
                {showManual ? "Kameraya Dön" : "Barkodu Elle Gir"}
              </button>
  
              <AnimatePresence>
                {showManual && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleManualSubmit}
                    className="w-full flex space-x-2 overflow-hidden"
                  >
                    <input 
                      type="text" 
                      placeholder="Barkod numarasını yazın..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/50 outline-none"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      autoFocus
                    />
                    <button 
                      type="submit"
                      className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform"
                    >
                      Sorgula
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white text-gray-900 rounded-3xl p-8 shadow-2xl"
          >
            {loading ? (
              <div className="text-center py-12 space-y-4">
                <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600 font-medium">Ürün Bilgileri Getiriliyor...</p>
              </div>
            ) : product ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full" style={{ backgroundColor: `${primaryColor}15` }}>
                    <Logo size={48} color={primaryColor} />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                  <p className="text-gray-500 mt-1">Barcode: {product.barcode}</p>
                </div>
                <div className="text-white p-6 rounded-2xl text-center" style={{ backgroundColor: primaryColor }}>
                  <span className="text-sm uppercase tracking-widest opacity-80">Price</span>
                  <div className="text-4xl font-black mt-1">
                    {product.price.toLocaleString('tr-TR', { 
                      style: 'currency', 
                      currency: product.currency || store?.default_currency || 'TRY' 
                    })}
                  </div>
                </div>
                {product.description && (
                  <div className="text-gray-600 text-sm border-t pt-4">
                    {product.description}
                  </div>
                )}
                <button 
                  onClick={() => { setProduct(null); setScanning(true); setError(""); }}
                  className="w-full text-white py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  Scan Another
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                <h2 className="text-xl font-bold">Product Not Found</h2>
                <p className="text-gray-500">{error}</p>
                <button 
                  onClick={() => { setScanning(true); setError(""); }}
                  className="w-full text-white py-4 rounded-xl font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Try Again
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="mt-auto pt-8 text-center">
        <button 
          onClick={() => window.location.href = '/login'}
          className="text-white/50 text-xs hover:text-white transition-colors"
        >
          Store Admin Login
        </button>
      </div>
    </div>
  );
};

const StoreDashboard = ({ token, user }: { token: string, user: User }) => {
  const { storeId: paramStoreId } = useParams();
  const effectiveStoreId = user.role === 'superadmin' ? paramStoreId : user.store_id;

  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'branding' | 'users' | 'settings'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [branding, setBranding] = useState({ 
    logo_url: "", 
    primary_color: "#4f46e5", 
    default_currency: "TRY",
    background_image_url: ""
  });
  const [storeUsers, setStoreUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "editor" });
  const [showImport, setShowImport] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState({ barcode: "", name: "", price: "", currency: "TRY", description: "" });
  const [headers, setHeaders] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState({ barcode: "", name: "", price: "", description: "", currency: "TRY" });
  const [storeSlug, setStoreSlug] = useState("");
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  const isViewer = user.role === 'viewer';
  const isEditor = user.role === 'editor';
  const isAdmin = user.role === 'storeadmin' || user.role === 'superadmin';

  useEffect(() => {
    fetchProducts();
    fetchStoreInfo();
    fetchAnalytics();
    fetchStoreUsers();
  }, [effectiveStoreId]);

  const fetchStoreUsers = async () => {
    const url = effectiveStoreId ? `/api/store/users?storeId=${effectiveStoreId}` : "/api/store/users";
    const data = await api.get(url, token);
    if (Array.isArray(data)) {
      setStoreUsers(data);
    } else {
      setStoreUsers([]);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/api/store/users", { ...newUser, storeId: effectiveStoreId }, token);
    if (res.success) {
      setShowAddUser(false);
      setNewUser({ email: "", password: "", role: "editor" });
      fetchStoreUsers();
    } else {
      alert(res.error || "Kullanıcı eklenemedi");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
      const url = effectiveStoreId ? `/api/store/users/${id}?storeId=${effectiveStoreId}` : `/api/store/users/${id}`;
      const res = await api.delete(url, token);
      if (res.success) {
        fetchStoreUsers();
      }
    }
  };

  const fetchStoreInfo = async () => {
    const url = effectiveStoreId ? `/api/store/info?storeId=${effectiveStoreId}` : "/api/store/info";
    const data = await api.get(url, token);
    if (data && data.slug) {
      setStoreSlug(data.slug);
      const defaultCurrency = data.default_currency || "TRY";
      setBranding({ 
        logo_url: data.logo_url || "", 
        primary_color: data.primary_color || "#4f46e5",
        default_currency: defaultCurrency,
        background_image_url: data.background_image_url || ""
      });
      setNewProduct(prev => ({ ...prev, currency: defaultCurrency }));
      setMapping(prev => ({ ...prev, currency: defaultCurrency }));
    }
  };

  const fetchAnalytics = async () => {
    const url = effectiveStoreId ? `/api/store/analytics?storeId=${effectiveStoreId}` : "/api/store/analytics";
    const data = await api.get(url, token);
    setAnalytics(data);
  };

  const fetchProducts = async () => {
    const url = effectiveStoreId ? `/api/store/products?storeId=${effectiveStoreId}` : "/api/store/products";
    const data = await api.get(url, token);
    if (Array.isArray(data)) {
      setProducts(data);
    } else {
      setProducts([]);
    }
    setLoading(false);
  };

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/api/store/branding", { ...branding, storeId: effectiveStoreId }, token);
    if (res.success) {
      alert("Görünüm ayarları kaydedildi!");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordMessage({ type: "error", text: "Yeni şifreler eşleşmiyor" });
    }
    const res = await api.post("/api/auth/change-password", { 
      currentPassword: passwordData.currentPassword, 
      newPassword: passwordData.newPassword 
    }, token);
    if (res.success) {
      setPasswordMessage({ type: "success", text: "Şifreniz başarıyla güncellendi" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPasswordMessage({ type: "error", text: res.error || "Şifre güncellenemedi" });
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/api/store/products", { ...newProduct, storeId: effectiveStoreId }, token);
    if (res.success) {
      setShowAddManual(false);
      setNewProduct({ barcode: "", name: "", price: "", description: "", currency: "TRY" });
      fetchProducts();
    } else {
      alert(res.error || "Ürün eklenemedi");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.put(`/api/store/products/${editingProduct.id}`, { ...editingProduct, storeId: effectiveStoreId }, token);
    if (res.success) {
      setEditingProduct(null);
      fetchProducts();
    } else {
      alert(res.error || "Ürün güncellenemedi");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
      const url = effectiveStoreId ? `/api/store/products/${id}?storeId=${effectiveStoreId}` : `/api/store/products/${id}`;
      const res = await api.delete(url, token);
      if (res.success) {
        fetchProducts();
      }
    }
  };

  const handleDeleteAllProducts = async () => {
    if (window.confirm("TÜM ürünleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
      const url = effectiveStoreId ? `/api/store/products/all?storeId=${effectiveStoreId}` : "/api/store/products/all";
      const res = await api.delete(url, token);
      if (res.success) {
        fetchProducts();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result;
        if (data) {
          const workbook = XLSX.read(data, { type: 'array' });
          const wsname = workbook.SheetNames[0];
          const ws = workbook.Sheets[wsname];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (json.length > 0) {
            setHeaders(json[0] as string[]);
          }
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!file) {
      alert("Lütfen bir dosya seçin.");
      return;
    }
    if (!mapping.barcode || !mapping.name || !mapping.price) {
      alert("Lütfen Barkod, İsim ve Fiyat sütunlarını eşleştirin.");
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));
    if (effectiveStoreId) {
      formData.append("storeId", String(effectiveStoreId));
    }
    
    try {
      const res = await api.upload("/api/store/import", formData, token);
      if (res.success) {
        setShowImport(false);
        fetchProducts();
        alert(`İçe aktarma başarılı! ${res.count} ürün eklendi/güncellendi.`);
      } else {
        alert("Hata: " + (res.error || "İçe aktarma başarısız oldu."));
      }
    } catch (e) {
      alert("Sunucuyla iletişim kurulurken bir hata oluştu.");
    } finally {
      setImporting(false);
    }
  };

  const scanUrl = `${window.location.origin}/scan/${storeSlug || 'demo'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === 'superadmin' ? `${storeSlug.toUpperCase()} - Ürün Yönetimi` : 'Ürün Envanteri'}
          </h1>
          <p className="text-gray-500">
            {user.role === 'superadmin' ? 'Süper Admin olarak bu mağazayı yönetiyorsunuz' : 'Mağazanızın ürünlerini ve fiyatlarını yönetin'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isViewer && (
            <>
              <button 
                onClick={handleDeleteAllProducts}
                className="flex items-center bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Tümünü Sil
              </button>
              <button 
                onClick={() => setShowQR(true)}
                className="flex items-center bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Scan className="h-4 w-4 mr-2" /> Store QR
              </button>
              <button 
                onClick={() => setShowImport(true)}
                className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" /> Excel'den Yükle
              </button>
              <button 
                onClick={() => setShowAddManual(true)}
                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Package className="h-4 w-4 mr-2" /> Manuel Ürün Ekle
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Logo size={16} className="mr-2" /> Ürünler
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BarChart3 className="h-4 w-4 mr-2" /> Analizler
        </button>
        {!isViewer && (
          <button 
            onClick={() => setActiveTab('branding')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'branding' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Palette className="h-4 w-4 mr-2" /> Görünüm
          </button>
        )}
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Users className="h-4 w-4 mr-2" /> Ekip
          </button>
        )}
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Settings className="h-4 w-4 mr-2" /> Ayarlar
        </button>
      </div>

      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-sm w-full text-center relative"
            >
              <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-xl font-bold mb-2">Your Store QR Code</h2>
              <p className="text-sm text-gray-500 mb-6">Customers can scan this to check prices in your store.</p>
              <div className="bg-gray-50 p-6 rounded-2xl inline-block mb-6">
                <QRCodeSVG value={scanUrl} size={200} />
              </div>
              <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all mb-6">
                {scanUrl}
              </div>
              <button 
                onClick={() => window.print()}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
              >
                Print QR Code
              </button>
            </motion.div>
          </div>
        )}

        {showAddManual && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-md w-full relative"
            >
              <button onClick={() => setShowAddManual(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-xl font-bold mb-6">Manuel Ürün Ekle</h2>
              <form onSubmit={handleAddManual} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Barkod</label>
                  <input required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ürün Adı</label>
                  <input required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fiyat</label>
                    <input type="number" step="0.01" required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Para Birimi</label>
                    <select className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newProduct.currency} onChange={e => setNewProduct({...newProduct, currency: e.target.value})}>
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-4">Ürünü Kaydet</button>
              </form>
            </motion.div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-md w-full relative"
            >
              <button onClick={() => setEditingProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-xl font-bold mb-6">Ürünü Düzenle</h2>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Barkod</label>
                  <input required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={editingProduct.barcode} onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ürün Adı</label>
                  <input required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fiyat</label>
                    <input type="number" step="0.01" required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Para Birimi</label>
                    <select className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={editingProduct.currency} onChange={e => setEditingProduct({...editingProduct, currency: e.target.value})}>
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" rows={3} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-4">Güncelle</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeTab === 'products' && (
        <>
          {showImport && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg mb-8"
            >
              <h2 className="text-lg font-bold mb-4">Import Products from Excel/CSV</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                  <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  <div className="mt-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <p className="text-xs text-indigo-700">
                      <strong>İpucu:</strong> Türkçe karakterler için Excel (.xlsx) dosyasını tercih edin. CSV kullanıyorsanız UTF-8 kodlamalı olduğundan emin olun.
                    </p>
                  </div>
                </div>
                {headers.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Map Columns</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['barcode', 'name', 'price', 'description'].map(field => (
                        <div key={field}>
                          <span className="text-xs uppercase text-gray-400">{field}</span>
                          <select 
                            className="w-full mt-1 p-2 border rounded-md text-sm"
                            onChange={(e) => setMapping({...mapping, [field]: e.target.value})}
                          >
                            <option value="">Select Column</option>
                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <button onClick={() => setShowImport(false)} className="px-4 py-2 text-gray-500" disabled={importing}>İptal</button>
                      <button 
                        onClick={handleImport} 
                        disabled={importing}
                        className={`px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {importing ? 'Yükleniyor...' : 'İçe Aktarmayı Başlat'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barkod</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{p.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{p.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{p.barcode}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {p.price.toLocaleString('tr-TR', { style: 'currency', currency: p.currency })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!isViewer && (
                        <>
                          <button 
                            onClick={() => setEditingProduct(p)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Düzenle
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Sil
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Henüz ürün bulunamadı. Ürün ekleyerek başlayın!</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
              <div className="bg-indigo-50 p-4 rounded-xl mr-4">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Toplam Tarama</p>
                <h3 className="text-3xl font-bold text-gray-900">{analytics?.totalScans?.count || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
              <div className="bg-green-50 p-4 rounded-xl mr-4">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Aktif Ürün Sayısı</p>
                <h3 className="text-3xl font-bold text-gray-900">{products.length}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
              <div className="bg-orange-50 p-4 rounded-xl mr-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Son 24 Saat</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {analytics?.scansByDay && analytics.scansByDay.length > 0 
                    ? analytics.scansByDay[analytics.scansByDay.length - 1]?.count 
                    : 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" /> Günlük Tarama Trendi
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.scansByDay || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    name="Tarama Sayısı"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" /> En Çok Sorgulanan Ürünler
              </h3>
              <div className="space-y-4">
                {analytics?.topProducts?.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center mr-3 text-xs font-bold text-indigo-600">
                        {i+1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.barcode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-indigo-600">{p.count}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Tarama</p>
                    </div>
                  </div>
                ))}
                {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                  <p className="text-center text-gray-400 py-8">Henüz veri yok</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-indigo-600" /> Günlük Detaylı Veri
              </h3>
              <div className="space-y-3">
                {analytics?.scansByDay?.slice().reverse().map((day: any) => (
                  <div key={day.date} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600 font-medium">{day.date}</span>
                    <div className="flex items-center">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden mr-4">
                        <div 
                          className="h-full bg-indigo-500" 
                          style={{ 
                            width: `${Math.min(100, (day.count / (Math.max(...(analytics?.scansByDay?.map((d:any)=>d.count) || [1])) || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{day.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-indigo-600" /> Son Taramalar
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase">Ürün</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase">Barkod</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-400 uppercase">Zaman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics?.recentScans?.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{s.barcode}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 text-right">
                        {new Date(s.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {(!analytics?.recentScans || analytics.recentScans.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">Henüz tarama yapılmadı</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="max-w-2xl bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <Palette className="h-5 w-5 mr-2 text-indigo-600" /> Görünüm Ayarları
          </h3>
          <form onSubmit={handleUpdateBranding} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mağaza Logosu (URL)</label>
              <div className="flex space-x-4">
                <input 
                  type="url" 
                  className="flex-1 p-3 bg-gray-50 border rounded-xl" 
                  value={branding.logo_url} 
                  onChange={e => setBranding({...branding, logo_url: e.target.value})} 
                  placeholder="https://example.com/logo.png"
                />
                {branding.logo_url && (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                    <img src={branding.logo_url} alt="Preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Varsayılan Para Birimi</label>
              <select 
                className="w-full p-3 bg-gray-50 border rounded-xl" 
                value={branding.default_currency} 
                onChange={e => setBranding({...branding, default_currency: e.target.value})}
              >
                <option value="TRY">TL (TRY)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EURO (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <p className="mt-2 text-xs text-gray-400">Yeni ürünler eklenirken varsayılan olarak bu para birimi seçilecektir.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ana Renk (Primary Color)</label>
              <div className="flex items-center space-x-4">
                <input 
                  type="color" 
                  className="h-12 w-24 p-1 bg-gray-50 border rounded-xl cursor-pointer" 
                  value={branding.primary_color} 
                  onChange={e => setBranding({...branding, primary_color: e.target.value})} 
                />
                <span className="text-sm font-mono text-gray-500 uppercase">{branding.primary_color}</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">Bu renk müşteri tarama sayfasının arka planı ve butonları için kullanılacaktır.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arka Plan Görseli (URL)</label>
              <div className="flex space-x-4">
                <input 
                  type="url" 
                  className="flex-1 p-3 bg-gray-50 border rounded-xl" 
                  value={branding.background_image_url} 
                  onChange={e => setBranding({...branding, background_image_url: e.target.value})} 
                  placeholder="https://example.com/background.jpg"
                />
                {branding.background_image_url && (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                    <img src={branding.background_image_url} alt="Preview" className="max-w-full max-h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-400">Müşteri tarama sayfasında arka planda saydam olarak gösterilecektir.</p>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100">
              Ayarları Kaydet
            </button>
          </form>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" /> Ekip Yönetimi
            </h3>
            <button 
              onClick={() => setShowAddUser(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              Yeni Kullanıcı Ekle
            </button>
          </div>

          {showAddUser && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 p-6 rounded-2xl border border-gray-200"
            >
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-posta</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full p-2 border rounded-lg text-sm" 
                    value={newUser.email} 
                    onChange={e => setNewUser({...newUser, email: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Şifre</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full p-2 border rounded-lg text-sm" 
                    value={newUser.password} 
                    onChange={e => setNewUser({...newUser, password: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Rol</label>
                  <select 
                    className="w-full p-2 border rounded-lg text-sm" 
                    value={newUser.role} 
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="editor">Editör (Ürün yönetebilir)</option>
                    <option value="viewer">İzleyici (Sadece raporlar)</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold">Ekle</button>
                  <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 text-gray-500 text-sm">İptal</button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {storeUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'storeadmin' ? 'bg-purple-100 text-purple-700' : u.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {u.role !== 'storeadmin' && (
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-900">Sil</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <Lock className="h-5 w-5 mr-2 text-indigo-600" /> Hesap ve Şifre Ayarları
          </h3>
          
          <form onSubmit={handleChangePassword} className="space-y-6">
            {passwordMessage.text && (
              <div className={`p-4 rounded-xl flex items-center text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {passwordMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                {passwordMessage.text}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Şifre</label>
              <input 
                type="password" 
                required 
                className="w-full p-3 bg-gray-50 border rounded-xl" 
                value={passwordData.currentPassword} 
                onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                <input 
                  type="password" 
                  required 
                  className="w-full p-3 bg-gray-50 border rounded-xl" 
                  value={passwordData.newPassword} 
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
                <input 
                  type="password" 
                  required 
                  className="w-full p-3 bg-gray-50 border rounded-xl" 
                  value={passwordData.confirmPassword} 
                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                />
              </div>
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100">
              Şifreyi Güncelle
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const SuperAdminDashboard = ({ token }: { token: string }) => {
  const [activeTab, setActiveTab] = useState<'stores' | 'leads'>('stores');
  const [stores, setStores] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [systemStats, setSystemStats] = useState<any>(null);
  const [newStore, setNewStore] = useState({ 
    name: "", 
    slug: "", 
    address: "",
    contact_person: "",
    phone: "",
    email: "",
    admin_email: "", 
    admin_password: "", 
    subscription_end: "",
    default_currency: "TRY"
  });

  useEffect(() => {
    fetchStores();
    fetchSystemStats();
    fetchLeads();
  }, []);

  const fetchStores = async () => {
    const data = await api.get("/api/admin/stores", token);
    if (Array.isArray(data)) {
      setStores(data);
    } else {
      setStores([]);
    }
  };

  const fetchLeads = async () => {
    const data = await api.get("/api/admin/leads", token);
    if (Array.isArray(data)) {
      setLeads(data);
    } else {
      setLeads([]);
    }
  };

  const fetchSystemStats = async () => {
    const data = await api.get("/api/admin/stats", token);
    setSystemStats(data);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.put(`/api/admin/leads/${editingLead.id}`, editingLead, token);
    if (res.success) {
      setEditingLead(null);
      fetchLeads();
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (window.confirm("Bu talebi silmek istediğinize emin misiniz?")) {
      const res = await api.delete(`/api/admin/leads/${id}`, token);
      if (res.success) fetchLeads();
    }
  };

  const leadStatuses = [
    "Yeni", "Görüşmede", "Aksiyon Bekliyor", "Ödeme bekliyor", "Dosya Bekliyor", "Dosya Transfer bekliyor", "Tamamlandı"
  ];

  const probabilities = [
    { label: "Soğuk", color: "bg-blue-100 text-blue-700" },
    { label: "Ilık", color: "bg-orange-100 text-orange-700" },
    { label: "Sıcak", color: "bg-red-100 text-red-700" }
  ];

  const getProbabilityColor = (prob: string) => {
    return probabilities.find(p => p.label === prob)?.color || "bg-gray-100 text-gray-700";
  };

  const filteredStores = Array.isArray(stores) ? stores.filter(s => {
    const name = s.name || "";
    const slug = s.slug || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || slug.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = s.subscription_end ? new Date(s.subscription_end) > new Date() : false;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? isActive : !isActive);
    return matchesSearch && matchesStatus;
  }) : [];

  const stats = {
    total: Array.isArray(stores) ? stores.length : 0,
    active: Array.isArray(stores) ? stores.filter(s => new Date(s.subscription_end) > new Date()).length : 0,
    expired: Array.isArray(stores) ? stores.filter(s => new Date(s.subscription_end) <= new Date()).length : 0
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.put(`/api/admin/stores/${editingStore.id}`, editingStore, token);
    if (res.success) {
      setEditingStore(null);
      fetchStores();
    } else {
      alert(res.error || "Failed to update store");
    }
  };

  const handleBulkSubscription = async (days: number) => {
    if (selectedStoreIds.length === 0) return;
    const res = await api.post("/api/admin/stores/bulk-subscription", { storeIds: selectedStoreIds, days }, token);
    if (res.success) {
      alert(`${selectedStoreIds.length} mağazanın aboneliği ${days} gün uzatıldı.`);
      setSelectedStoreIds([]);
      fetchStores();
    }
  };

  const toggleStoreSelection = (id: number) => {
    setSelectedStoreIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/api/admin/stores", newStore, token);
    if (res.success) {
      setShowAdd(false);
      fetchStores();
      setNewStore({ 
        name: "", 
        slug: "", 
        address: "",
        contact_person: "",
        phone: "",
        email: "",
        admin_email: "", 
        admin_password: "", 
        subscription_end: "" 
      });
    } else {
      alert(res.error || "Failed to create store");
    }
  };

  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistem Yönetimi</h1>
          <div className="flex space-x-4 mt-2">
            <button 
              onClick={() => setActiveTab('stores')}
              className={`pb-2 px-1 text-sm font-bold transition-all ${activeTab === 'stores' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Mağazalar
            </button>
            <button 
              onClick={() => setActiveTab('leads')}
              className={`pb-2 px-1 text-sm font-bold transition-all relative ${activeTab === 'leads' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Müşteri Talepleri
              {leads.filter(l => l.status === 'Yeni').length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {leads.filter(l => l.status === 'Yeni').length}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'stores' && (
            <>
              {selectedStoreIds.length > 0 && (
                <div className="flex items-center bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-right-4">
                  <span className="text-sm font-bold text-indigo-700 mr-4">{selectedStoreIds.length} Seçildi</span>
                  <div className="flex space-x-1">
                    <button onClick={() => handleBulkSubscription(30)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">+30 Gün</button>
                    <button onClick={() => handleBulkSubscription(90)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">+90 Gün</button>
                    <button onClick={() => handleBulkSubscription(365)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">+1 Yıl</button>
                  </div>
                </div>
              )}
              <button 
                onClick={() => setShowAdd(true)}
                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" /> Yeni Mağaza Kaydı
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'stores' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
              <div className="bg-indigo-50 p-4 rounded-xl mr-4">
                <Logo size={24} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Toplam Mağaza</p>
                <h3 className="text-3xl font-bold text-gray-900">{systemStats?.totalStores || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
              <div className="bg-green-50 p-4 rounded-xl mr-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Aktif Abonelik</p>
                <h3 className="text-3xl font-bold text-gray-900">{systemStats?.activeStores || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
              <div className="bg-orange-50 p-4 rounded-xl mr-4">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Toplam Tarama</p>
                <h3 className="text-3xl font-bold text-gray-900">{systemStats?.totalScans || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
              <div className="bg-blue-50 p-4 rounded-xl mr-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Son 24 Saat</p>
                <h3 className="text-3xl font-bold text-gray-900">{systemStats?.scansLast24h || 0}</h3>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Mağaza ismi veya slug ile ara..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tümü
              </button>
              <button 
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Aktif
              </button>
              <button 
                onClick={() => setFilterStatus('expired')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'expired' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Süresi Dolan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map(store => (
              <motion.div 
                key={store.id}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedStoreIds.includes(store.id)}
                      onChange={() => toggleStoreSelection(store.id)}
                      className="mr-3 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="bg-indigo-50 p-3 rounded-xl">
                      <Logo size={24} className="text-indigo-600" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${new Date(store.subscription_end) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {new Date(store.subscription_end) > new Date() ? 'Active' : 'Expired'}
                    </span>
                    <button 
                      onClick={() => setEditingStore(store)}
                      className="mt-2 text-xs text-indigo-600 hover:underline flex items-center"
                    >
                      <Edit2 className="h-3 w-3 mr-1" /> Düzenle
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{store.name}</h3>
                <p className="text-sm text-gray-500 mb-4">/{store.slug}</p>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <ChevronRight className="h-4 w-4 mr-1 text-indigo-400" />
                  Ends: {new Date(store.subscription_end).toLocaleDateString()}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSelectedStore(store)}
                    className="bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Search className="h-4 w-4 mr-1" /> Detaylar
                  </button>
                  <button 
                    onClick={() => {
                      window.open(`${window.location.origin}/dashboard/${store.id}`, '_blank');
                    }}
                    className="bg-indigo-50 text-indigo-700 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center justify-center"
                  >
                    <LogOut className="h-4 w-4 mr-1 rotate-180" /> Sisteme Git
                  </button>
                  <button 
                    onClick={() => {
                      window.open(`${window.location.origin}/scan/${store.slug}`, '_blank');
                    }}
                    className="col-span-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <Scan className="h-4 w-4 mr-1" /> Scan Sayfası (Müşteri)
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Müşteri / Mağaza</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">İletişim</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Statü</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Olasılık</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Tarih</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.store_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{lead.phone}</div>
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getProbabilityColor(lead.probability)}`}>
                        {lead.probability}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setEditingLead(lead)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && (
              <div className="p-12 text-center text-gray-400">Henüz bir talep bulunmuyor.</div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {editingLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-md w-full relative"
            >
              <button onClick={() => setEditingLead(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-2xl font-bold mb-6">Talebi Yönet</h2>
              
              <form onSubmit={handleUpdateLead} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Süreç Statüsü</label>
                  <div className="grid grid-cols-2 gap-2">
                    {leadStatuses.map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setEditingLead({...editingLead, status})}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${editingLead.status === status ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Satış Olasılığı</label>
                  <div className="flex space-x-2">
                    {probabilities.map(prob => (
                      <button
                        key={prob.label}
                        type="button"
                        onClick={() => setEditingLead({...editingLead, probability: prob.label})}
                        className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all ${editingLead.probability === prob.label ? 'ring-2 ring-indigo-600 ring-offset-2 ' + prob.color : 'bg-gray-50 text-gray-500'}`}
                      >
                        {prob.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Görüşme Notları</label>
                  <textarea 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    rows={4}
                    value={editingLead.notes || ""}
                    onChange={e => setEditingLead({...editingLead, notes: e.target.value})}
                    placeholder="Görüşme detaylarını buraya not alabilirsiniz..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">Güncelle</button>
                  <button type="button" onClick={() => setEditingLead(null)} className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all">Kapat</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingStore && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setEditingStore(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-2xl font-bold mb-6">Mağaza Düzenle: {editingStore.name}</h2>
              <form onSubmit={handleUpdateStore} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mağaza İsmi</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.name} 
                      onChange={e => setEditingStore({...editingStore, name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Slug</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.slug} 
                      onChange={e => setEditingStore({...editingStore, slug: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Adres</label>
                    <textarea 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.address} 
                      onChange={e => setEditingStore({...editingStore, address: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Yetkili Kişi</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.contact_person} 
                      onChange={e => setEditingStore({...editingStore, contact_person: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Telefon</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.phone} 
                      onChange={e => setEditingStore({...editingStore, phone: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-posta</label>
                    <input 
                      type="email" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.email} 
                      onChange={e => setEditingStore({...editingStore, email: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Para Birimi</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.default_currency || "TRY"} 
                      onChange={e => setEditingStore({...editingStore, default_currency: e.target.value})}
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Yeni Yönetici Şifresi (Opsiyonel)</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.admin_password || ""} 
                      onChange={e => setEditingStore({...editingStore, admin_password: e.target.value})} 
                      placeholder="Değiştirmek için yeni şifre girin"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex space-x-3 mt-4">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Güncelle</button>
                  <button type="button" onClick={() => setEditingStore(null)} className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-bold">İptal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedStore && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setSelectedStore(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-2xl font-bold mb-6">{selectedStore.name} Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Company Information</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">Address</p>
                    <p className="text-gray-900">{selectedStore.address || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">Contact Person</p>
                    <p className="text-gray-900">{selectedStore.contact_person || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">Phone</p>
                    <p className="text-gray-900">{selectedStore.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">Store Email</p>
                    <p className="text-gray-900">{selectedStore.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">System Access</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">Admin Login Email</p>
                    <p className="text-gray-900 font-mono">{selectedStore.admin_email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">Subscription End Date</p>
                    <p className="text-gray-900">{new Date(selectedStore.subscription_end).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="pt-4 flex flex-col space-y-2">
                    <button 
                      onClick={() => {
                        window.open(`${window.location.origin}/dashboard/${selectedStore.id}`, '_blank');
                      }}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center"
                    >
                      <LogOut className="h-4 w-4 mr-2 rotate-180" /> Mağaza Paneline Git
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedStore(null)}
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold mt-8"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-xl mb-8"
        >
          <h2 className="text-xl font-bold mb-6">Register New Store</h2>
          <form onSubmit={handleAddStore} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase">Store Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store Name</label>
                <input required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} placeholder="e.g. Migros" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug (URL identifier)</label>
                <input required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.slug} onChange={e => setNewStore({...newStore, slug: e.target.value})} placeholder="e.g. migros" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" rows={2} value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <input className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.contact_person} onChange={e => setNewStore({...newStore, contact_person: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.phone} onChange={e => setNewStore({...newStore, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store Email</label>
                <input type="email" className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.email} onChange={e => setNewStore({...newStore, email: e.target.value})} />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase">Admin Account</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Login Email</label>
                <input type="email" required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.admin_email} onChange={e => setNewStore({...newStore, admin_email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Password</label>
                <input type="password" required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.admin_password} onChange={e => setNewStore({...newStore, admin_password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subscription End Date</label>
                <input type="date" required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.subscription_end} onChange={e => setNewStore({...newStore, subscription_end: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                <select 
                  className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" 
                  value={newStore.default_currency} 
                  onChange={e => setNewStore({...newStore, default_currency: e.target.value})}
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-10">
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-gray-500 font-medium">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200">Create Store</button>
              </div>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("token");
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      return null;
    }
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
          {/* Public Routes */}
          <Route path="/scan/:slug" element={<CustomerScanPage />} />
          <Route path="/forgot-password" element={
            <>
              <Navbar user={null} onLogout={handleLogout} />
              <ForgotPasswordPage />
            </>
          } />
          <Route path="/reset-password/:token" element={
            <>
              <Navbar user={null} onLogout={handleLogout} />
              <ResetPasswordPage />
            </>
          } />
          
          {/* Auth Routes */}
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

          {/* Protected Routes */}
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

          <Route path="/" element={
            <>
              <Navbar user={token ? user : null} onLogout={handleLogout} />
              <LandingPage />
            </>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
