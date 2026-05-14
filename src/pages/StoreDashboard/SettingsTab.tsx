import React from "react";
import { 
  Save, 
  Upload, 
  Globe, 
  Palette, 
  Settings, 
  User, 
  Lock,
  Mail,
  Smartphone,
  MapPin,
  CreditCard,
  Languages,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Image as ImageIcon,
  Info,
  ArrowRight,
  Building2,
  ShoppingBag,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Download,
  AlertTriangle,
  Truck,
  Plus,
  Trash2,
  Wrench,
  Tag,
  Star,
  X,
  Cpu,
  Cpu as CpuIcon,
  ShieldCheck,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "@/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { useIntegrationSync } from "../../hooks/useIntegrationSync";
import { DEVELOPED_COUNTRIES } from "../../constants";
import { api } from "../../services/api";
import { PageBuilder } from "../../components/PageBuilder";

interface SettingsTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  onSaveBranding: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddUser: () => void;
  onDeleteUser: (id: number) => void;
  users: any[];
  currentUser: any;
  currentStoreId?: number;
  products?: any[];
  onRefresh?: () => void;
  bulkPriceForm: any;
  setBulkPriceForm: (form: any) => void;
  handleBulkPriceSubmit: (e: React.FormEvent) => Promise<void>;
}

const SettingsTab = ({ 
  branding, 
  onBrandingChange, 
  onSaveBranding, 
  onLogoUpload, 
  onFaviconUpload,
  onBannerUpload,
  onAddUser,
  onDeleteUser,
  users,
  currentUser,
  currentStoreId,
  products = [],
  onRefresh,
  bulkPriceForm,
  setBulkPriceForm,
  handleBulkPriceSubmit
}: SettingsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang]?.dashboard || {};
  const amazonSync = useIntegrationSync('Amazon', t);
  const n11Sync = useIntegrationSync('N11', t);
  const hbSync = useIntegrationSync('Hepsiburada', t);
  const tySync = useIntegrationSync('Trendyol', t);
  const pzSync = useIntegrationSync('Pazarama', t);

  const [amazonClientId, setAmazonClientId] = React.useState(branding.amazon_settings?.clientId || "");
  const [amazonClientSecret, setAmazonClientSecret] = React.useState(branding.amazon_settings?.clientSecret || "");
  const [amazonRefreshToken, setAmazonRefreshToken] = React.useState(branding.amazon_settings?.refresh_token || "");
  const [amazonSellerId, setAmazonSellerId] = React.useState(branding.amazon_settings?.sellerId || "");
  
  const [n11AppKey, setN11AppKey] = React.useState(branding.n11_settings?.appKey || "");
  const [n11AppSecret, setN11AppSecret] = React.useState(branding.n11_settings?.appSecret || "");

  const [hbApiKey, setHbApiKey] = React.useState(branding.hepsiburada_settings?.apiKey || "");
  const [hbApiSecret, setHbApiSecret] = React.useState(branding.hepsiburada_settings?.apiSecret || "");
  const [hbMerchantId, setHbMerchantId] = React.useState(branding.hepsiburada_settings?.merchantId || "");

  const [tyApiKey, setTyApiKey] = React.useState(branding.trendyol_settings?.apiKey || "");
  const [tyApiSecret, setTyApiSecret] = React.useState(branding.trendyol_settings?.apiSecret || "");
  const [tyMerchantId, setTyMerchantId] = React.useState(branding.trendyol_settings?.merchantId || "");

  const [pzApiKey, setPzApiKey] = React.useState(branding.pazarama_settings?.apiKey || "");
  const [pzApiSecret, setPzApiSecret] = React.useState(branding.pazarama_settings?.apiSecret || "");
  const [pzMerchantId, setPzMerchantId] = React.useState(branding.pazarama_settings?.merchantId || "");
  const [pzCommissionRate, setPzCommissionRate] = React.useState(branding.pazarama_settings?.commissionRate || 0);
  const [pzCategories, setPzCategories] = React.useState<any[]>([]);
  const [pzBrands, setPzBrands] = React.useState<any[]>([]);
  const [loadingPzCats, setLoadingPzCats] = React.useState(false);
  const [loadingPzBrands, setLoadingPzBrands] = React.useState(false);
  const [pzCategoryMappings, setPzCategoryMappings] = React.useState<Record<string, string>>(branding.pazarama_settings?.categoryMappings || {});
  const [pzBrandMappings, setPzBrandMappings] = React.useState<Record<string, string>>(branding.pazarama_settings?.brandMappings || {});
  const [showPzMapping, setShowPzMapping] = React.useState(false);
  const [showPzBrandMapping, setShowPzBrandMapping] = React.useState(false);
  const [verifyingDomain, setVerifyingDomain] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState<{ a: boolean, cname: boolean, ip: string | null, target: string | null } | null>(null);
  const [cfStatus, setCfStatus] = React.useState<any>(null);
  const [cfNameServers, setCfNameServers] = React.useState<string[]>([]);
  const [cfConfigured, setCfConfigured] = React.useState(false);
  const [showManualCf, setShowManualCf] = React.useState(false);
  const [manualCfToken, setManualCfToken] = React.useState("");
  const [manualCfAccount, setManualCfAccount] = React.useState("");
  const [manualCfEmail, setManualCfEmail] = React.useState("");
  const [loadingCf, setLoadingCf] = React.useState(false);
  const [testingEInvoice, setTestingEInvoice] = React.useState(false);

  // Sync Pazarama state when branding prop changes
  React.useEffect(() => {
    const s = branding.pazarama_settings || {};
    setPzApiKey(s.apiKey || "");
    setPzApiSecret(s.apiSecret || "");
    setPzMerchantId(s.merchantId || "");
    setPzCommissionRate(s.commissionRate || 0);
    setPzCategoryMappings(s.categoryMappings || {});
    setPzBrandMappings(s.brandMappings || {});
  }, [branding.pazarama_settings]);

  const handleTestEInvoice = async () => {
    setTestingEInvoice(true);
    try {
      const res = await api.testEInvoiceConnection();
      if (res.error) throw new Error(res.error);
      alert(res.message || (lang === 'tr' ? "Bağlantı başarılı!" : "Connection successful!"));
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? "Bağlantı hatası!" : "Connection error!"));
    } finally {
      setTestingEInvoice(false);
    }
  };

  const [emails, setEmails] = React.useState<string[]>((branding.emails && branding.emails.length > 0) ? branding.emails : ['']);
  const [phones, setPhones] = React.useState<string[]>((branding.phones && branding.phones.length > 0) ? branding.phones : ['']);
  const [activeSubTab, setActiveSubTab] = useState<string>(localStorage.getItem(`settingsSubTab_${currentStoreId || 'admin'}`) || 'web');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.getAuditLogs(currentStoreId);
      // Filter for integration logs if possible, or just show all
      setLogs(res || []);
    } catch (error) {
      console.error("Logs fetch error:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'logs') {
      fetchLogs();
    }
  }, [activeSubTab]);
  
  const addEmail = () => setEmails([...emails, '']);
  const removeEmail = (index: number) => setEmails(emails.filter((_, i) => i !== index));
  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addPhone = () => setPhones([...phones, '']);
  const removePhone = (index: number) => setPhones(phones.filter((_, i) => i !== index));
  const updatePhone = (index: number, value: string) => {
    const newPhones = [...phones];
    newPhones[index] = value;
    setPhones(newPhones);
  };

  React.useEffect(() => {
    onBrandingChange('emails', emails);
    onBrandingChange('phones', phones);
    // Sync singular fields for compatibility with Showcase footer
    if (emails.length > 0 && emails[0]) {
      onBrandingChange('email', emails[0]);
    }
    if (phones.length > 0 && phones[0]) {
      onBrandingChange('phone', phones[0]);
    }
  }, [emails, phones]);

  React.useEffect(() => {
    localStorage.setItem(`settingsSubTab_${currentStoreId || 'admin'}`, activeSubTab);
  }, [activeSubTab, currentStoreId]);

  React.useEffect(() => {
    if (branding.custom_domain) {
      fetchCfStatus();
    }
  }, [branding.custom_domain]);

  if (!branding) return null;

  const amazonSettings = branding.amazon_settings || {};
  const isAmazonConnected = !!amazonSettings.refresh_token;

  const n11Settings = branding.n11_settings || {};
  const isN11Connected = !!n11Settings.connected;

  const hbSettings = branding.hepsiburada_settings || {};
  const isHbConnected = !!hbSettings.connected;

  const tySettings = branding.trendyol_settings || {};
  const isTyConnected = !!tySettings.connected;

  const pzSettings = branding.pazarama_settings || {};
  const isPzConnected = !!pzSettings.connected;

  const handleConnectAmazon = async () => {
    try {
      const { url } = await api.getAmazonAuthUrl();
      window.location.href = url;
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveAmazonSettings = async () => {
    try {
      await api.saveAmazonSettings({ 
        clientId: amazonClientId, 
        clientSecret: amazonClientSecret, 
        refreshToken: amazonRefreshToken, 
        sellerId: amazonSellerId, 
        storeId: currentStoreId 
      });
      alert(t.saveSuccess);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncOrders = async () => {
    await amazonSync.runSync(
      () => api.syncAmazonOrders(currentStoreId),
      (res) => {
        alert(`${t.amazonSyncSuccess}: ${res.count} ${t.sales}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectAmazon = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectAmazon(currentStoreId);
      alert(t.amazonDisconnected);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveN11Settings = async () => {
    try {
      await api.saveN11Settings({ appKey: n11AppKey, appSecret: n11AppSecret, storeId: currentStoreId });
      alert(t.saveSuccess);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncN11Orders = async () => {
    await n11Sync.runSync(
      () => api.syncN11Orders(currentStoreId),
      (res) => {
        alert(`${t.n11SyncSuccess}: ${res.count} ${t.sales}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectN11 = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectN11(currentStoreId);
      alert(t.n11Disconnected);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveHbSettings = async () => {
    try {
      await api.saveHepsiburadaSettings({ apiKey: hbApiKey, apiSecret: hbApiSecret, merchantId: hbMerchantId, storeId: currentStoreId });
      alert(t.saveSuccess);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncHbOrders = async () => {
    await hbSync.runSync(
      () => api.syncHepsiburadaOrders(currentStoreId),
      (res) => {
        alert(`${t.hepsiburadaSyncSuccess}: ${res.count} ${t.sales}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectHb = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectHepsiburada(currentStoreId);
      alert(t.hepsiburadaDisconnected);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveTySettings = async () => {
    try {
      await api.saveTrendyolSettings({ apiKey: tyApiKey, apiSecret: tyApiSecret, merchantId: tyMerchantId, storeId: currentStoreId });
      alert(t.saveSuccess);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncTyOrders = async () => {
    await tySync.runSync(
      () => api.syncTrendyolOrders(currentStoreId),
      (res) => {
        alert(`${t.trendyolSyncSuccess}: ${res.count} ${t.sales}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectTy = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectTrendyol(currentStoreId);
      alert(t.trendyolDisconnected);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleTestN11 = async () => {
    try {
      const res = await api.testN11Connection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'N11 Bağlantısı Başarılı!' : 'N11 Connection Successful!') : `${lang === 'tr' ? 'N11 Bağlantı Hatası' : 'N11 Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleTestHb = async () => {
    try {
      const res = await api.testHepsiburadaConnection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'Hepsiburada Bağlantısı Başarılı!' : 'Hepsiburada Connection Successful!') : `${lang === 'tr' ? 'Hepsiburada Bağlantı Hatası' : 'Hepsiburada Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleTestTy = async () => {
    try {
      const res = await api.testTrendyolConnection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'Trendyol Bağlantısı Başarılı!' : 'Trendyol Connection Successful!') : `${lang === 'tr' ? 'Trendyol Bağlantı Hatası' : 'Trendyol Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleTestPz = async () => {
    try {
      const res = await api.testPazaramaConnection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'Pazarama Bağlantısı Başarılı!' : 'Pazarama Connection Successful!') : `${lang === 'tr' ? 'Pazarama Bağlantı Hatası' : 'Pazarama Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSavePzSettings = async () => {
    try {
      const pzData = { 
        apiKey: pzApiKey, 
        apiSecret: pzApiSecret, 
        merchantId: pzMerchantId,
        commissionRate: Number(pzCommissionRate),
        categoryMappings: pzCategoryMappings,
        brandMappings: pzBrandMappings,
        connected: !!(pzApiKey && pzApiSecret)
      };
      await api.savePazaramaSettings({ 
        ...pzData,
        storeId: currentStoreId 
      } as any);
      onBrandingChange('pazarama_settings', pzData);
      alert(t.saveSuccess);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const fetchPzCategories = async () => {
    if (!pzApiKey || !pzApiSecret) {
      alert(lang === 'tr' ? 'Önce API bilgilerini kaydedin' : 'Save API credentials first');
      return;
    }
    setLoadingPzCats(true);
    try {
      const res = await api.getPazaramaCategories(currentStoreId);
      if (res.error) {
        throw new Error(res.error);
      }
      
      // Backend now returns only the data array, but being safe
      const cats = Array.isArray(res) ? res : (res?.data || []);
      if (cats.length === 0) {
        alert(lang === 'tr' ? 'Pazarama\'dan hiç kategori gelmedi. Lütfen API bilgilerinizin doğruluğunu ve yetkilerini kontrol edin.' : 'No categories received from Pazarama. Please check your API credentials and permissions.');
      }
      setPzCategories(cats);
      setShowPzMapping(true);
    } catch (e: any) {
      console.error("Pazarama Category Fetch Error:", e);
      alert(`${lang === 'tr' ? "Kategoriler çekilemedi" : "Could not fetch categories"}: ${e.message}`);
    } finally {
      setLoadingPzCats(false);
    }
  };

  const fetchPzBrands = async () => {
    if (!pzApiKey || !pzApiSecret) {
      alert(lang === 'tr' ? 'Önce API bilgilerini kaydedin' : 'Save API credentials first');
      return;
    }
    setLoadingPzBrands(true);
    try {
      const res = await api.getPazaramaBrands(currentStoreId);
      if (res.error) {
        throw new Error(res.error);
      }

      // Backend now returns only the data array, but being safe
      const brands = Array.isArray(res) ? res : (res?.data || []);
      if (brands.length === 0) {
        alert(lang === 'tr' ? 'Pazarama\'dan hiç marka gelmedi. Lütfen API bilgilerinizin doğruluğunu ve yetkilerini kontrol edin.' : 'No brands received from Pazarama. Please check your API credentials and permissions.');
      }
      setPzBrands(brands);
      setShowPzBrandMapping(true);
    } catch (e: any) {
      console.error("Pazarama Brand Fetch Error:", e);
      alert(`${lang === 'tr' ? "Markalar çekilemedi" : "Could not fetch brands"}: ${e.message}`);
    } finally {
      setLoadingPzBrands(false);
    }
  };

  const localCategories = React.useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p: any) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  const localBrands = React.useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p: any) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands);
  }, [products]);

  const handleSyncPzOrders = async () => {
    await pzSync.runSync(
      () => api.syncPazaramaOrders(currentStoreId),
      (res) => {
        alert(`${t.pazaramaSyncSuccess}: ${res.count} ${t.sales}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectPz = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectPazarama(currentStoreId);
      onBrandingChange('pazarama_settings', {});
      alert(t.pazaramaDisconnected);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleVerifyDomain = async () => {
    if (!branding.custom_domain) {
      alert(lang === 'tr' ? 'Lütfen bir domain girin' : 'Please enter a domain');
      return;
    }
    setVerifyingDomain(true);
    setVerificationResult(null);
    try {
      const res = await api.verifyDomain(branding.custom_domain);
      if (res.error) {
        throw new Error(res.error);
      }
      setVerificationResult(res);
      if (res.a && res.cname) {
        // Automatically save if verified
        onSaveBranding();
      }
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? 'Doğrulama sırasında bir hata oluştu' : 'An error occurred during verification'));
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleConnectCloudflare = async () => {
    if (!branding.custom_domain) {
      alert(lang === 'tr' ? 'Lütfen bir domain girin' : 'Please enter a domain');
      return;
    }
    setLoadingCf(true);
    try {
      const res = await api.addCustomDomain(branding.custom_domain, currentStoreId, {
        manualToken: manualCfToken || undefined,
        manualAccount: manualCfAccount || undefined,
        manualEmail: manualCfEmail || undefined
      });
      if (res.error) {
        if (res.error.toLowerCase().includes("configuration missing")) {
          setShowManualCf(true);
        }
        throw new Error(res.error);
      }
      alert(lang === 'tr' ? 'Domain Cloudflare sistemine eklendi. Lütfen doğrulama kayıtlarını bekleyin.' : 'Domain added to Cloudflare. Please wait for verification records.');
      if (manualCfToken && manualCfAccount) {
        setCfConfigured(true);
      }
      setManualCfToken("");
      setManualCfAccount("");
      setManualCfEmail("");
      fetchCfStatus();
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? 'Hata oluştu' : 'Error occurred'));
    } finally {
      setLoadingCf(false);
    }
  };

  const handleManualSave = async () => {
    if (!branding.custom_domain) {
      alert(lang === 'tr' ? 'Lütfen bir domain girin' : 'Please enter a domain');
      return;
    }
    setLoadingCf(true);
    try {
      const res = await api.saveCustomDomainManual(branding.custom_domain, currentStoreId);
      if (res.error) throw new Error(res.error);
      alert(lang === 'tr' ? 'Domain başarıyla kaydedildi. Şimdi DNS kayıtlarınızı (A Kaydı) yönlendirebilirsiniz.' : 'Domain saved successfully. You can now point your DNS records (A Record).');
      fetchCfStatus();
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? 'Hata oluştu' : 'Error occurred'));
    } finally {
      setLoadingCf(false);
    }
  };

  const fetchCfStatus = async () => {
    try {
      const res = await api.getCustomDomainStatus(currentStoreId);
      if (res.domain) {
        setCfStatus({ status: res.status, domain: res.domain });
        if (res.status === 'manual') {
          setCfNameServers([]);
        } else {
          setCfNameServers(res.name_servers || []);
        }
      } else {
        setCfStatus(null);
        setCfNameServers([]);
      }
      // Set configured state from backend flag
      setCfConfigured(!!res.isConfigured);
    } catch (error) {
      console.error("CF Status fetch error:", error);
    }
  };

  React.useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await api.getCustomDomainStatus(currentStoreId);
        setCfConfigured(!!res.isConfigured);
      } catch (e) {
        console.error("Config check error:", e);
      }
    };
    checkConfig();
  }, [currentStoreId]);

  React.useEffect(() => {
    if (activeSubTab === 'web' && branding.custom_domain) {
      fetchCfStatus();
      const interval = setInterval(fetchCfStatus, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [activeSubTab, branding.custom_domain]);

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto pb-24">
        {/* Sub-tab Navigation */}
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30 flex flex-wrap gap-1">
          <button 
            onClick={() => setActiveSubTab('web')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'web' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Palette className="h-4 w-4" />
            <span>{t.settingsCategories?.webSettings}</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('store-ops')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'store-ops' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Wrench className="h-4 w-4" />
            <span>Store Settings</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('pos')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'pos' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <CreditCard className="h-4 w-4" />
            <span>{t.settingsCategories?.posSettings}</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('e-stores')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'e-stores' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{t.settingsCategories?.eStores}</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('domain')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'domain' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Globe className="h-4 w-4" />
            <span>{t.settingsCategories?.domainSettings}</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('e-invoice')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'e-invoice' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Building2 className="h-4 w-4" />
            <span>E-Invoice</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('logs')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'logs' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <History className="h-4 w-4" />
            <span>{lang === 'tr' ? 'Günlük' : 'Logs'}</span>
          </button>
        </div>

      {activeSubTab === 'logs' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-slate-100 rounded-2xl">
                  <History className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{lang === 'tr' ? 'İşlem ve Entegrasyon Günlüğü' : 'Integration & Audit Logs'}</h2>
                  <p className="text-sm text-slate-500">{lang === 'tr' ? 'Son yapılan işlemler ve pazar yeri senkronizasyon detayları' : 'Recent activities and marketplace sync details'}</p>
                </div>
              </div>
              <button 
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-4">
              {loadingLogs ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-slate-300 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  {lang === 'tr' ? 'Kayıt bulunamadı.' : 'No logs found.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-4 pl-4">{lang === 'tr' ? 'Tarih' : 'Date'}</th>
                        <th className="pb-4">{lang === 'tr' ? 'İşlem' : 'Action'}</th>
                        <th className="pb-4 text-center">{lang === 'tr' ? 'Detay' : 'Details'}</th>
                        <th className="pb-4 pr-4 text-right">{lang === 'tr' ? 'Veri' : 'Data'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {logs.map((log: any) => (
                        <tr key={log.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pl-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                            {new Date(log.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              log.action?.includes('error') ? 'bg-rose-50 text-rose-600' :
                              log.action?.includes('warning') ? 'bg-amber-50 text-amber-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-4 text-slate-700 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </td>
                          <td className="py-4 pr-4 text-right">
                            {log.metadata ? (
                              <button 
                                onClick={() => alert(JSON.stringify(log.metadata, null, 2))}
                                className="text-xs text-blue-600 hover:underline font-bold"
                              >
                                {lang === 'tr' ? 'HAM VERİ' : 'RAW DATA'}
                              </button>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'store-ops' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Currency & Language */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{lang === 'tr' ? 'Para Birimi & Dil' : 'Currency & Language'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Yerelleştirme Ayarları' : 'Localization Settings'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.defaultCurrency}</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select 
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 appearance-none cursor-pointer"
                    value={branding.default_currency || "TRY"}
                    onChange={(e) => onBrandingChange('default_currency', e.target.value)}
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.defaultLanguage}</label>
                <div className="relative">
                  <Languages className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select 
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 appearance-none cursor-pointer"
                    value={branding.default_language || branding.language || "tr"}
                    onChange={(e) => onBrandingChange('language', e.target.value)}
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-sm font-bold text-slate-900 mb-4">{t.crossExchangeRates || 'Çapraz Kurlar'}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['USD', 'EUR', 'GBP'].map(curr => (
                    <div key={curr} className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{curr} {t.rate || 'Kuru'}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                          value={branding.currency_rates?.[curr] || ""}
                          onChange={(e) => {
                            const rates = { ...(branding.currency_rates || {}) };
                            rates[curr] = parseFloat(e.target.value);
                            onBrandingChange('currency_rates', rates);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tax Rates & Rules */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Vergi Ayarları</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Varsayılan KDV Oranı (%)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                    value={branding.default_tax_rate !== undefined ? String(Math.floor(Number(branding.default_tax_rate))) : '20'}
                    onChange={(e) => onBrandingChange('default_tax_rate', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kategori KDV Kuralları</label>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="new-category-name"
                      placeholder="Kategori Adı"
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                      <input 
                        type="text" 
                        id="new-category-tax"
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const catInput = document.getElementById('new-category-name') as HTMLInputElement;
                        const taxInput = document.getElementById('new-category-tax') as HTMLInputElement;
                        if (catInput.value.trim() && taxInput.value) {
                          const newRules = [...(branding.category_tax_rules || [])];
                          newRules.push({ category: catInput.value.trim(), taxRate: parseInt(taxInput.value.replace(/[^0-9]/g, '')) || 0 });
                          onBrandingChange('category_tax_rules', newRules);
                          catInput.value = '';
                          taxInput.value = '';
                        }
                      }}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"
                    >
                      Ekle
                    </button>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    {(branding.category_tax_rules || []).map((rule: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-slate-700">{rule.category}</span>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">KDV %{rule.taxRate}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const newRules = [...branding.category_tax_rules];
                            newRules.splice(idx, 1);
                            onBrandingChange('category_tax_rules', newRules);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm font-bold"
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Profiles */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Kargo Ayarları</h3>
              </div>
              <button 
                onClick={() => {
                  const newProfiles = [...(branding.shipping_profiles || []), { id: Date.now().toString(), name: '', cost: 0, currency: branding.default_currency || 'TRY' }];
                  onBrandingChange('shipping_profiles', newProfiles);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" /> Yeni Profil
              </button>
            </div>
            
            <div className="space-y-4">
              {(branding.shipping_profiles || []).map((profile: any, index: number) => (
                <div key={profile.id || index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex-1 w-full">
                    <input value={profile.name} onChange={(e) => { const p = [...branding.shipping_profiles]; p[index].name = e.target.value; onBrandingChange('shipping_profiles', p); }} placeholder="Profil Adı" className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold mb-2" />
                    <div className="flex gap-2">
                       <input type="number" value={profile.cost} onChange={(e) => { const p = [...branding.shipping_profiles]; p[index].cost = parseFloat(e.target.value); onBrandingChange('shipping_profiles', p); }} placeholder="Ücret" className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold" />
                       <input disabled value={profile.currency} className="w-20 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-semibold" />
                    </div>
                  </div>
                  <button onClick={() => { const p = [...branding.shipping_profiles]; p.splice(index, 1); onBrandingChange('shipping_profiles', p); }} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Store Locator & Reservations */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Mağaza ve Rezervasyon</h3>
              </div>
            </div>
            
            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={!!branding.reservation_enabled}
                  onChange={(e) => onBrandingChange('reservation_enabled', e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-bold text-slate-900">Mağazadan Teslimat (Rezervasyon) Aktif Et</span>
              </label>

              <div className="space-y-4">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mağaza Konumları</h4>
                 {(branding.locations || []).map((loc: any, idx: number) => (
                   <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl items-center">
                     <input name={`location_name_${idx}`} id={`location_name_${idx}`} value={loc.name} onChange={(e) => { const l = [...(branding.locations||[])]; l[idx] = { ...l[idx], name: e.target.value }; onBrandingChange('locations', l); }} placeholder="Mağaza Adı" className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold" />
                     <input name={`location_address_${idx}`} id={`location_address_${idx}`} value={loc.address} onChange={(e) => { const l = [...(branding.locations||[])]; l[idx] = { ...l[idx], address: e.target.value }; onBrandingChange('locations', l); }} placeholder="Adres" className="col-span-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold" />
                   </div>
                 ))}
                 <button 
                  onClick={() => onBrandingChange('locations', [...(branding.locations || []), { name: '', address: '', active: true }])}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                 >Mağaza Ekle</button>
              </div>
            </div>
          </div>

          {/* Bulk Price Update */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                <RefreshCw className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Toplu Fiyat Güncelleme</h3>
            </div>
            
            <form onSubmit={handleBulkPriceSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Hedef</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                    value={bulkPriceForm.target}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, target: e.target.value })}
                  >
                    <option value="all">Tüm Ürünler</option>
                    <option value="category">Kategori Bazlı</option>
                  </select>
                </div>
                {bulkPriceForm.target === 'category' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kategori</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                      value={bulkPriceForm.category}
                      onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, category: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">İşlem Tipi</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                    value={bulkPriceForm.type}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, type: e.target.value })}
                  >
                    <option value="percentage">Yüzde (%)</option>
                    <option value="fixed">Sabit Tutar</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Yön</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                    value={bulkPriceForm.direction}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, direction: e.target.value })}
                  >
                    <option value="increase">Artır</option>
                    <option value="decrease">Azalt</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Değer</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                    value={bulkPriceForm.value}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, value: e.target.value })}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                Fiyatları Güncelle
              </button>
            </form>
          </div>

          <div className="flex justify-end pt-6">
            <button onClick={onSaveBranding} className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center gap-3">
              <Save className="w-5 h-5" />
              Tüm Mağaza Ayarlarını Kaydet
            </button>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'e-invoice' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{lang === 'tr' ? 'Resmi Belge & E-Fatura' : 'Official Docs & E-Invoice'}</h3>
                <p className="text-xs text-slate-500 mt-1">{lang === 'tr' ? 'E-Fatura sistemini açıp kapatın ve entegratör ayarlarınızı yapın.' : 'Enable/disable e-invoice system and configure your integrator.'}</p>
              </div>
            </div>

            {/* Toggle System */}
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-800">{lang === 'tr' ? 'E-Fatura Sistemi Aktif' : 'E-Invoice System Active'}</h4>
                <p className="text-sm text-slate-500">{lang === 'tr' ? 'Eğer bu ülkede/mağazada e-fatura kullanmıyorsanız kapalı tutun.' : 'Keep this disabled if you do not use e-invoices in your country/store.'}</p>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding?.einvoice_settings?.is_active ? 'bg-indigo-600' : 'bg-slate-300'}`}
                onClick={() => {
                  const currentParams = branding?.einvoice_settings || { provider: 'none' };
                  onBrandingChange('einvoice_settings', { ...currentParams, is_active: !currentParams.is_active });
                }}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding?.einvoice_settings?.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {branding?.einvoice_settings?.is_active && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Entegratör (Servis Sağlayıcı)' : 'Integrator (Provider)'}</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-medium"
                    value={branding.einvoice_settings.provider || 'none'}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, provider: e.target.value })}
                  >
                    <option value="none">-- {lang === 'tr' ? 'Seçiniz' : 'Select'} --</option>
                    <option value="mysoft">MySoft</option>
                    <option value="diyalogo">Diyalogo (Yakında)</option>
                  </select>
                </div>
                
                {branding.einvoice_settings.provider === 'mysoft' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-bold text-slate-700 mb-4">{lang === 'tr' ? 'MySoft Kimlik Bilgileri' : 'MySoft Credentials'}</h4>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">MySoft E-Fatura API URL (Opsiyonel)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="https://edocumentapi.mysoft.com.tr/api"
                        value={branding.einvoice_settings.api_url || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, api_url: e.target.value })}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {lang === 'tr' 
                          ? 'Önemli: iysapi.mysoft.com.tr adresi IYS izinleri içindir, e-fatura için kullanılamaz. Özel bir adresiniz yoksa boş bırakın.' 
                          : 'Important: iysapi.mysoft.com.tr is for IYS permissions, not for e-invoice. Leave blank if you don\'t have a custom address.'}
                      </p>
                    </div>

                    {/* User & Auth */}
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'MySoft Kullanıcı Adı' : 'MySoft Username'}</label>
                       <input 
                         type="text" 
                         className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                         placeholder="Kullanıcı adınızı girin"
                         value={branding.einvoice_settings.username || ''}
                         onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, username: e.target.value })}
                       />
                     </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'MySoft Şifre' : 'MySoft Password'}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="••••••••"
                        value={branding.einvoice_settings.password || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, password: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleTestEInvoice}
                        disabled={testingEInvoice}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${testingEInvoice ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:shadow-md active:scale-95'}`}
                      >
                        {testingEInvoice ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            {lang === 'tr' ? 'Bağlantı Test Ediliyor...' : 'Testing Connection...'}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            {lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test Connection'}
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Kullanıcı ID (Tenant ID)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                          placeholder="Örn: 210"
                          value={branding.einvoice_settings.tenant_id || ''}
                          onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, tenant_id: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Connector GUID (MySoft)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                          placeholder="Örn: 00000000-0000-0000-0000-000000000000"
                          value={branding.einvoice_settings.connector_guid || ''}
                          onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, connector_guid: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Arşiv UUID (GİB)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          value={branding.einvoice_settings.earchive_uuid || ''}
                          onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_uuid: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Token / API Key (Statik)</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="Statik bir tokeniniz varsa girin (Opsiyonel)"
                        value={branding.einvoice_settings.api_token || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, api_token: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-200">
                      <h4 className="text-sm font-bold text-slate-700 mb-4">{lang === 'tr' ? 'GİB Etiket (Alias) Posta Kutuları' : 'GIB URN Alias Mailboxes'}</h4>
                      <p className="text-xs text-slate-500 mb-4">{lang === 'tr' ? 'Fatura paketlerinin (UBL) içine yazılacak resmi GİB gönderici ve alıcı etiketleriniz.' : 'Official URNs injected into the invoice XML payload.'}</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Gönderici Birim Alias (GB)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="urn:mail:faturagb@firma.com"
                        value={branding.einvoice_settings.sender_alias || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, sender_alias: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Posta Kutusu Alias (PK)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="urn:mail:faturapk@firma.com"
                        value={branding.einvoice_settings.receiver_alias || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, receiver_alias: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Arşiv Kullanıcı Adı</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="gapbilisim"
                        value={branding.einvoice_settings.earchive_username || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_username: e.target.value })}
                      />
                    </div>
                    
                    <div className="md:col-span-2 pt-4 border-t border-slate-200">
                      <h4 className="text-sm font-bold text-slate-700 mb-4">{lang === 'tr' ? 'Fatura Ön Ek (Seri) Ayarları' : 'Invoice Prefix Series'}</h4>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Ön Eki (Örn: GAP)</label>
                      <input 
                        type="text" 
                        maxLength={3}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm uppercase"
                        placeholder="GAP"
                        value={branding.einvoice_settings.einvoice_prefix || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, einvoice_prefix: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Arşiv Ön Eki (Örn: GEA)</label>
                      <input 
                        type="text" 
                        maxLength={3}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm uppercase"
                        placeholder="GEA"
                        value={branding.einvoice_settings.earchive_prefix || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_prefix: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeSubTab === 'pos' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Online Payment Gateways */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{lang === 'tr' ? 'Ödeme Yöntemleri' : 'Payment Gateways'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Online Tahsilat Seçenekleri' : 'Online Collection Options'}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Cash on Delivery */}
              <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery'}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Nakit veya Kart' : 'Cash or Card'}</p>
                  </div>
                </div>
                <button
                  onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), cod_enabled: !branding.payment_settings?.cod_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.payment_settings?.cod_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.cod_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Bank Transfer */}
              <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.bank_transfer_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{lang === 'tr' ? 'Banka Havalesi / EFT' : 'Bank Transfer / EFT'}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'IBAN ile Ödeme' : 'Payment via IBAN'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), bank_transfer_enabled: !branding.payment_settings?.bank_transfer_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.payment_settings?.bank_transfer_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.bank_transfer_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {branding.payment_settings?.bank_transfer_enabled && (
                  <div className="mt-4 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'BANKA HESAP BİLGİLERİ' : 'BANK ACCOUNT DETAILS'}</label>
                    <textarea 
                      className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none"
                      placeholder={lang === 'tr' ? 'IBAN, Banka Adı ve Alıcı ismini buraya yazın...' : 'Write IBAN, Bank Name and Receiver name here...'}
                      value={branding.payment_settings?.bank_details || ''}
                      onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), bank_details: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* PayPal */}
              <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">PayPal</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Global Ödeme' : 'Global Payment'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), paypal_enabled: !branding.payment_settings?.paypal_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.paypal_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {branding.payment_settings?.paypal_enabled && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">PayPal Client ID</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none"
                        value={branding.payment_settings?.paypal_client_id || ''}
                        onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), paypal_client_id: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payoneer */}
              <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.payoneer_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                      <CreditCard className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Payoneer</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Global Ödeme' : 'Global Payment'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), payoneer_enabled: !branding.payment_settings?.payoneer_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.payment_settings?.payoneer_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.payoneer_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {branding.payment_settings?.payoneer_enabled && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payoneer Account Email</label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none"
                        value={branding.payment_settings?.payoneer_email || ''}
                        onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), payoneer_email: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Iyzico */}
              <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.iyzico_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Iyzico Sanal POS</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Güvenli Kredi Kartı' : 'Secure Credit Card'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_enabled: !branding.payment_settings?.iyzico_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.payment_settings?.iyzico_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.iyzico_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {branding.payment_settings?.iyzico_enabled && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Key</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none"
                        value={branding.payment_settings?.iyzico_api_key || ''}
                        onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_api_key: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secret Key</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none"
                        value={branding.payment_settings?.iyzico_secret_key || ''}
                        onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_secret_key: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'Mod' : 'Mode'}</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        value={branding.payment_settings?.iyzico_sandbox ? 'true' : 'false'}
                        onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_sandbox: e.target.value === 'true' })}
                      >
                        <option value="true">Sandbox (Test)</option>
                        <option value="false">Production (Live)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* POS Bridge Configuration */}
          <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-slate-900 rounded-2xl text-indigo-400 border border-slate-800">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight tracking-tight">POS Köprüsü</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cihaz Entegrasyonu</p>
                  </div>
                </div>
                <button
                  onClick={() => onBrandingChange('pos_bridge_enabled', !branding.pos_bridge_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.pos_bridge_enabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.pos_bridge_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${branding.pos_bridge_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Köprü IP Adresi</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm font-mono text-indigo-400 outline-none focus:border-indigo-500/50 transition-all"
                      placeholder="192.168.1.XX"
                      value={branding.pos_bridge_ip || ''}
                      onChange={(e) => onBrandingChange('pos_bridge_ip', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Port</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm font-mono text-indigo-400 outline-none focus:border-indigo-500/50 transition-all"
                    placeholder="8080"
                    value={branding.pos_bridge_port || ''}
                    onChange={(e) => onBrandingChange('pos_bridge_port', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      {lang === 'tr' 
                        ? 'LookPrice POS Köprüsü, yerel ağınızdaki fiziksel POS cihazları ile bulut sistemi arasında güvenli bir bağlantı kurar. Bu ayar aktif olduğunda, yapılan satışlar otomatik olarak fiziksel terminale gönderilir.'
                        : 'LookPrice POS Bridge establishes a secure connection between physical POS devices on your local network and the cloud system.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'layout' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Sayfa Düzeni</h3>
            <PageBuilder 
              layout={branding.page_layout || []} 
              onUpdateLayout={(newLayout) => onBrandingChange('page_layout', newLayout)} 
            />
          </div>
        </div>
      )}

      {activeSubTab === 'menu' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{lang === 'tr' ? 'Menü Yönetimi' : 'Menu Management'}</h3>
              <p className="text-sm text-slate-500">
                {lang === 'tr' 
                  ? 'Buradan mağazanızın üst menüsünde görünecek bağlantıları yönetebilirsiniz. Yeni bir sayfa oluşturmaz, sadece mevcut bölümlere (örn: /#about) veya dış bağlantılara (örn: https://google.com) yönlendirme yapar.' 
                  : 'Manage the links that will appear in your store\'s top menu. This does not create new pages, it only links to existing sections (e.g., /#about) or external URLs.'}
              </p>
            </div>
            <div className="space-y-4">
              {(branding.menu_links || []).map((link: any, index: number) => (
                <div key={index} className="flex gap-4 items-center">
                  <input 
                    type="text" 
                    placeholder={lang === 'tr' ? 'Menü Adı' : 'Menu Name'}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={link.label}
                    onChange={(e) => {
                      const newLinks = [...(branding.menu_links || [])];
                      newLinks[index].label = e.target.value;
                      onBrandingChange('menu_links', newLinks);
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder={lang === 'tr' ? 'Link (örn: /about)' : 'Link (e.g., /about)'}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...(branding.menu_links || [])];
                      newLinks[index].url = e.target.value;
                      onBrandingChange('menu_links', newLinks);
                    }}
                  />
                  <button 
                    onClick={() => {
                      const newLinks = (branding.menu_links || []).filter((_: any, i: number) => i !== index);
                      onBrandingChange('menu_links', newLinks);
                    }}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  const newLinks = [...(branding.menu_links || []), { label: '', url: '' }];
                  onBrandingChange('menu_links', newLinks);
                }}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
              >
                {lang === 'tr' ? 'Yeni Link Ekle' : 'Add New Link'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">{lang === 'tr' ? 'Alt Menü (Yasal Sayfalar)' : 'Footer Menu (Legal Pages)'}</h3>
            <div className="space-y-4">
              {(branding.footer_links || []).map((link: any, index: number) => (
                <div key={index} className="flex gap-4 items-center">
                  <input 
                    type="text" 
                    placeholder={lang === 'tr' ? 'Sayfa Adı (örn: Gizlilik Politikası)' : 'Page Name (e.g., Privacy Policy)'}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={link.label}
                    onChange={(e) => {
                      const newLinks = [...(branding.footer_links || [])];
                      newLinks[index].label = e.target.value;
                      onBrandingChange('footer_links', newLinks);
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder={lang === 'tr' ? 'Link (örn: /privacy)' : 'Link (e.g., /privacy)'}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...(branding.footer_links || [])];
                      newLinks[index].url = e.target.value;
                      onBrandingChange('footer_links', newLinks);
                    }}
                  />
                  <button 
                    onClick={() => {
                      const newLinks = (branding.footer_links || []).filter((_: any, i: number) => i !== index);
                      onBrandingChange('footer_links', newLinks);
                    }}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  const newLinks = [...(branding.footer_links || []), { label: '', url: '' }];
                  onBrandingChange('footer_links', newLinks);
                }}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
              >
                {lang === 'tr' ? 'Yeni Sayfa Ekle' : 'Add New Page'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'e-stores' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.settingsCategories?.eStores}</h3>
              </div>
            </div>
            <div className="space-y-8">
              {/* Amazon Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.amazonIntegration}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.amazonIntegrationDesc}</p>
                    </div>
                  </div>
                  {isAmazonConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.amazonConnected}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.amazonClientId}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={amazonClientId}
                        onChange={(e) => setAmazonClientId(e.target.value)}
                        placeholder="LWA Client ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.amazonClientSecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={amazonClientSecret}
                        onChange={(e) => setAmazonClientSecret(e.target.value)}
                        placeholder="LWA Client Secret"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.amazonRefreshToken}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={amazonRefreshToken}
                        onChange={(e) => setAmazonRefreshToken(e.target.value)}
                        placeholder="Refresh Token"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.amazonSellerId}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={amazonSellerId}
                        onChange={(e) => setAmazonSellerId(e.target.value)}
                        placeholder="Seller ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {!isAmazonConnected ? (
                      <>
                        <button 
                          onClick={handleSaveAmazonSettings}
                          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.amazonConnectManual}</span>
                        </button>
                        <button 
                          onClick={handleConnectAmazon}
                          className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center justify-center space-x-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>{t.amazonConnectOAuth}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={handleSyncOrders}
                          disabled={amazonSync.isSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${amazonSync.isSyncing ? 'animate-spin' : ''}`} />
                          <span>{amazonSync.isSyncing ? t.loading : t.syncOrders}</span>
                        </button>
                        <button 
                          onClick={handleSaveAmazonSettings}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.update}</span>
                        </button>
                        <button 
                          onClick={handleDisconnectAmazon}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{t.disconnect}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isAmazonConnected && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {amazonSync.lastSync ? amazonSync.lastSync.toLocaleString() : (amazonSettings.last_sync ? new Date(amazonSettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never'))}
                      </p>
                      {amazonSync.lastError && (
                        <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <AlertTriangle className="h-4 w-4 shrink-0" />
                             <span className="font-medium">{amazonSync.lastError}</span>
                          </div>
                          <button onClick={handleSyncOrders} className="w-full text-xs font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors text-rose-700">{lang === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* N11 Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.n11Integration}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.n11IntegrationDesc}</p>
                    </div>
                  </div>
                  {isN11Connected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.n11Connected}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.n11AppKey}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={n11AppKey}
                        onChange={(e) => setN11AppKey(e.target.value)}
                        placeholder="App Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.n11AppSecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={n11AppSecret}
                        onChange={(e) => setN11AppSecret(e.target.value)}
                        placeholder="App Secret"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {!isN11Connected ? (
                      <button 
                        onClick={handleSaveN11Settings}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{t.connectN11}</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={handleSyncN11Orders}
                          disabled={n11Sync.isSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${n11Sync.isSyncing ? 'animate-spin' : ''}`} />
                          <span>{n11Sync.isSyncing ? t.loading : t.syncOrders}</span>
                        </button>
                        <button 
                          onClick={handleSaveN11Settings}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.update}</span>
                        </button>
                        <button 
                          onClick={handleDisconnectN11}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{t.disconnect}</span>
                        </button>
                        <button 
                          onClick={handleTestN11}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>{lang === 'tr' ? 'Test Et' : 'Test'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isN11Connected && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {n11Sync.lastSync ? n11Sync.lastSync.toLocaleString() : (n11Settings.last_sync ? new Date(n11Settings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never'))}
                      </p>
                      {n11Sync.lastError && (
                        <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <AlertTriangle className="h-4 w-4 shrink-0" />
                             <span className="font-medium">{n11Sync.lastError}</span>
                          </div>
                          <button onClick={handleSyncN11Orders} className="w-full text-xs font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors text-rose-700">{lang === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Hepsiburada Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.hepsiburadaIntegration}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.hepsiburadaIntegrationDesc}</p>
                    </div>
                  </div>
                  {isHbConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.hepsiburadaConnected}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.hepsiburadaApiKey}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={hbApiKey}
                        onChange={(e) => setHbApiKey(e.target.value)}
                        placeholder="API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.hepsiburadaApiSecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={hbApiSecret}
                        onChange={(e) => setHbApiSecret(e.target.value)}
                        placeholder="API Secret"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.hepsiburadaMerchantId}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={hbMerchantId}
                        onChange={(e) => setHbMerchantId(e.target.value)}
                        placeholder="Merchant ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {!isHbConnected ? (
                      <button 
                        onClick={handleSaveHbSettings}
                        className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{t.connectHepsiburada}</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={handleSyncHbOrders}
                          disabled={hbSync.isSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${hbSync.isSyncing ? 'animate-spin' : ''}`} />
                          <span>{hbSync.isSyncing ? t.loading : t.syncOrders}</span>
                        </button>
                        <button 
                          onClick={handleSaveHbSettings}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.update}</span>
                        </button>
                        <button 
                          onClick={handleDisconnectHb}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{t.disconnect}</span>
                        </button>
                        <button 
                          onClick={handleTestHb}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>{lang === 'tr' ? 'Test Et' : 'Test'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isHbConnected && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {hbSync.lastSync ? hbSync.lastSync.toLocaleString() : (hbSettings.last_sync ? new Date(hbSettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never'))}
                      </p>
                      {hbSync.lastError && (
                        <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <AlertTriangle className="h-4 w-4 shrink-0" />
                             <span className="font-medium">{hbSync.lastError}</span>
                          </div>
                          <button onClick={handleSyncHbOrders} className="w-full text-xs font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors text-rose-700">{lang === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Trendyol Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-50 rounded-xl text-orange-600 border border-orange-100">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.trendyolIntegration}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.trendyolIntegrationDesc}</p>
                    </div>
                  </div>
                  {isTyConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.trendyolConnected}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.trendyolApiKey}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={tyApiKey}
                        onChange={(e) => setTyApiKey(e.target.value)}
                        placeholder="API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.trendyolApiSecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={tyApiSecret}
                        onChange={(e) => setTyApiSecret(e.target.value)}
                        placeholder="API Secret"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.trendyolMerchantId}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={tyMerchantId}
                        onChange={(e) => setTyMerchantId(e.target.value)}
                        placeholder="Merchant ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {!isTyConnected ? (
                      <button 
                        onClick={handleSaveTySettings}
                        className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center justify-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{t.connectTrendyol}</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={handleSyncTyOrders}
                          disabled={tySync.isSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${tySync.isSyncing ? 'animate-spin' : ''}`} />
                          <span>{tySync.isSyncing ? t.loading : t.syncOrders}</span>
                        </button>
                        <button 
                          onClick={handleSaveTySettings}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.update}</span>
                        </button>
                        <button 
                          onClick={handleDisconnectTy}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{t.disconnect}</span>
                        </button>
                        <button 
                          onClick={handleTestTy}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-orange-200 hover:text-orange-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>{lang === 'tr' ? 'Test Et' : 'Test'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isTyConnected && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {tySync.lastSync ? tySync.lastSync.toLocaleString() : (tySettings.last_sync ? new Date(tySettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never'))}
                      </p>
                      {tySync.lastError && (
                        <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <AlertTriangle className="h-4 w-4 shrink-0" />
                             <span className="font-medium">{tySync.lastError}</span>
                          </div>
                          <button onClick={handleSyncTyOrders} className="w-full text-xs font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors text-rose-700">{lang === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pazarama Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.pazaramaIntegration}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.pazaramaIntegrationDesc}</p>
                    </div>
                  </div>
                  {isPzConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.pazaramaConnected}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                        {lang === 'tr' ? 'Satıcı ID' : 'Merchant ID'}
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={pzMerchantId}
                        onChange={(e) => setPzMerchantId(e.target.value)}
                        placeholder="ae486bf3-..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.pazaramaApiKey}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={pzApiKey}
                        onChange={(e) => setPzApiKey(e.target.value)}
                        placeholder="API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.pazaramaApiSecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={pzApiSecret}
                        onChange={(e) => setPzApiSecret(e.target.value)}
                        placeholder="API Secret"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                        {lang === 'tr' ? 'Komisyon Oranı (%)' : 'Commission Rate (%)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                        <input 
                          type="number" 
                          className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                          value={pzCommissionRate}
                          onChange={(e) => setPzCommissionRate(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {!isPzConnected ? (
                      <button 
                        onClick={handleSavePzSettings}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{t.connectPazarama}</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={handleSyncPzOrders}
                          disabled={pzSync.isSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${pzSync.isSyncing ? 'animate-spin' : ''}`} />
                          <span>{pzSync.isSyncing ? t.loading : t.syncOrders}</span>
                        </button>
                        <button 
                          onClick={handleSavePzSettings}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.update}</span>
                        </button>
                        <button 
                          onClick={handleDisconnectPz}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{t.disconnect}</span>
                        </button>
                        <button 
                          onClick={handleTestPz}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>{lang === 'tr' ? 'Test Et' : 'Test'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isPzConnected && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Tag className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-bold text-slate-900">{lang === 'tr' ? 'Kategori Eşleştirme' : 'Category Mapping'}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{lang === 'tr' ? 'Pazarama kategorilerini kendi kategorilerinle eşle' : 'Map Pazarama categories with your own categories'}</p>
                            </div>
                          </div>
                          <button 
                            onClick={fetchPzCategories}
                            disabled={loadingPzCats}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                          >
                            {loadingPzCats ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            <span>{lang === 'tr' ? 'Verileri Çek' : 'Fetch Data'}</span>
                          </button>
                        </div>

                        {showPzMapping && (
                          <div className="mt-6 space-y-4 pt-4 border-t border-blue-100">
                            {localCategories.length === 0 ? (
                              <p className="text-xs text-slate-500 italic">{lang === 'tr' ? 'Henüz kategori içeren ürününüz yok.' : 'No products with categories found.'}</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-3">
                                {localCategories.map(cat => (
                                  <div key={cat} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-blue-50">
                                    <span className="text-xs font-bold text-slate-700">{cat}</span>
                                    <select 
                                      className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 min-w-[200px]"
                                      value={pzCategoryMappings[cat] || ""}
                                      onChange={(e) => setPzCategoryMappings({...pzCategoryMappings, [cat]: e.target.value})}
                                    >
                                      <option value="">{lang === 'tr' ? 'Pazarama Kategorisi Seç' : 'Select Pazarama Category'}</option>
                                      {pzCategories.map((pzCat: any) => (
                                        <option key={pzCat.id || pzCat.categoryId || pzCat.CategoryId} value={pzCat.id || pzCat.categoryId || pzCat.CategoryId}>
                                          {pzCat.name || pzCat.categoryName || pzCat.CategoryName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex justify-end pt-2">
                              <button 
                                onClick={handleSavePzSettings}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-all"
                              >
                                {lang === 'tr' ? 'Eşleştirmeleri Kaydet' : 'Save Mappings'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Tag className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="text-sm font-bold text-slate-900">{lang === 'tr' ? 'Marka Eşleştirme' : 'Brand Mapping'}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{lang === 'tr' ? 'Pazarama markalarını kendi markalarınla eşle' : 'Map Pazarama brands with your own brands'}</p>
                            </div>
                          </div>
                          <button 
                            onClick={fetchPzBrands}
                            disabled={loadingPzBrands}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                          >
                            {loadingPzBrands ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            <span>{lang === 'tr' ? 'Markaları Çek' : 'Fetch Brands'}</span>
                          </button>
                        </div>

                        {showPzBrandMapping && (
                          <div className="mt-6 space-y-4 pt-4 border-t border-purple-100">
                            {localBrands.length === 0 ? (
                              <p className="text-xs text-slate-500 italic">{lang === 'tr' ? 'Henüz marka içeren ürününüz yok.' : 'No products with brands found.'}</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-3">
                                {localBrands.map(brand => (
                                  <div key={brand} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-purple-50">
                                    <span className="text-xs font-bold text-slate-700">{brand}</span>
                                    <select 
                                      className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/10 min-w-[200px]"
                                      value={pzBrandMappings[brand] || ""}
                                      onChange={(e) => setPzBrandMappings({...pzBrandMappings, [brand]: e.target.value})}
                                    >
                                      <option value="">{lang === 'tr' ? 'Pazarama Markası Seç' : 'Select Pazarama Brand'}</option>
                                      {pzBrands.map((pzBrand: any) => (
                                        <option key={pzBrand.id || pzBrand.brandId || pzBrand.BrandId} value={pzBrand.id || pzBrand.brandId || pzBrand.BrandId}>
                                          {pzBrand.name || pzBrand.brandName || pzBrand.BrandName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex justify-end pt-2">
                              <button 
                                onClick={handleSavePzSettings}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-all"
                              >
                                {lang === 'tr' ? 'Eşleştirmeleri Kaydet' : 'Save Mappings'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {pzSync.lastSync ? pzSync.lastSync.toLocaleString() : (pzSettings.last_sync ? new Date(pzSettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never'))}
                      </p>
                      {pzSync.lastError && (
                        <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <AlertTriangle className="h-4 w-4 shrink-0" />
                             <span className="font-medium">{pzSync.lastError}</span>
                          </div>
                          <button onClick={handleSyncPzOrders} className="w-full text-xs font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors text-rose-700">{lang === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'domain' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{lang === 'tr' ? 'Özel Alan Adı (Domain) Ayarları' : 'Custom Domain Settings'}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{lang === 'tr' ? 'Mağazanızı kendi alan adınız üzerinden yayınlayın' : 'Publish your store on your own domain'}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Alan Adınız' : 'Your Domain Name'}</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-bold text-sm text-slate-900"
                      value={branding.custom_domain || ""}
                      onChange={(e) => {
                        onBrandingChange('custom_domain', e.target.value);
                      }}
                      placeholder="Örn: shop.magazam.com"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic ml-1">
                  {lang === 'tr' 
                    ? '* Domaininizi bağlamak için aşağıdaki otomatik sistemi kullanın. SSL sertifikanız otomatik olarak oluşturulacaktır.' 
                    : '* Use the automated system below to connect your domain. Your SSL certificate will be created automatically.'}
                </p>

                {/* Cloudflare SaaS Section */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {lang === 'tr' ? 'Cloudflare SaaS Otomatik SSL & Domain Bağlantısı' : 'Cloudflare SaaS Auto SSL & Domain Connection'}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {lang === 'tr' ? 'Sıfır manuel işlem ile domaininizi bağlayın' : 'Connect your domain with zero manual effort'}
                      </p>
                    </div>
                  </div>

                  {!cfStatus ? (
                    <div className="space-y-4">
                      {cfConfigured && !showManualCf ? (
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-green-900">
                                {lang === 'tr' ? 'Cloudflare Sistemi Hazır' : 'Cloudflare System Ready'}
                              </p>
                              <p className="text-[10px] text-green-700">
                                {lang === 'tr' ? 'Sistem anahtarları aktif. Mağaza için özel anahtar gerekmez.' : 'System keys are active. No store-specific keys needed.'}
                              </p>
                            </div>
                          </div>
                          {currentUser?.role === 'superadmin' && (
                            <button 
                              onClick={() => setShowManualCf(true)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                            >
                              {lang === 'tr' ? 'Manuel Gir' : 'Manual Entry'}
                            </button>
                          )}
                        </div>
                      ) : (
                        (currentUser?.role === 'superadmin' || !cfConfigured) && (
                          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                {lang === 'tr' ? 'Cloudflare API Bilgileri' : 'Cloudflare API Credentials'}
                              </p>
                              {cfConfigured && (
                                <button 
                                  onClick={() => setShowManualCf(false)}
                                  className="text-[10px] font-bold text-indigo-600"
                                >
                                  {lang === 'tr' ? 'Vazgeç' : 'Cancel'}
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-indigo-700 ml-1">Cloudflare Email (Required for Global API Key)</label>
                                <input 
                                  type="email"
                                  placeholder="Örn: user@example.com"
                                  value={manualCfEmail}
                                  onChange={(e) => setManualCfEmail(e.target.value)}
                                  className="w-full p-2.5 text-[11px] border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white mb-2"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-indigo-700 ml-1">Cloudflare API Token / Global Key</label>
                                <input 
                                  type="password"
                                  placeholder="Örn: 1234567890abcdef..."
                                  value={manualCfToken}
                                  onChange={(e) => setManualCfToken(e.target.value)}
                                  className="w-full p-2.5 text-[11px] border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-indigo-700 ml-1">Cloudflare Account ID</label>
                                <input 
                                  type="text"
                                  placeholder="Örn: a1b2c3d4e5f6..."
                                  value={manualCfAccount}
                                  onChange={(e) => setManualCfAccount(e.target.value)}
                                  className="w-full p-2.5 text-[11px] border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      )}

                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={handleConnectCloudflare}
                          disabled={loadingCf || !branding.custom_domain}
                          className="py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {loadingCf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                          <span>{lang === 'tr' ? 'Cloudflare ile Otomatik Bağla' : 'Auto Connect with Cloudflare'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-700">{lang === 'tr' ? 'Durum:' : 'Status:'}</span>
                          <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${cfStatus.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {cfStatus.status}
                          </span>
                        </div>
                        <button 
                          onClick={async () => {
                            if (!confirm(lang === 'tr' ? 'DNS kayıtları onarılsın mı? (Error 1000 hatasını çözer)' : 'Repair DNS records? (Fixes Error 1000)')) return;
                            setLoadingCf(true);
                            try {
                              await api.post(`/api/store/domain/fix?storeId=${currentStoreId}`, {});
                              alert(lang === 'tr' ? 'DNS kayıtları onarıldı ve Gri Bulut moduna alındı.' : 'DNS records repaired and set to Grey Cloud.');
                              fetchCfStatus();
                            } catch (e: any) {
                              alert(e.message);
                            } finally {
                              setLoadingCf(false);
                            }
                          }}
                          disabled={loadingCf}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <Wrench className="h-3 w-3" />
                          {lang === 'tr' ? 'DNS Onar' : 'Fix DNS'}
                        </button>
                      </div>

                      {cfNameServers && cfNameServers.length > 0 && cfStatus.status !== 'active' && (
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                          <p className="text-xs font-bold text-indigo-900">
                            {lang === 'tr' ? 'Domaininizi Bağlamak İçin Name Serverları Güncelleyin' : 'Update Name Servers to Connect Your Domain'}
                          </p>
                          <p className="text-[10px] text-indigo-600 leading-relaxed">
                            {lang === 'tr' 
                              ? 'Domaininizi aldığınız panelden aşağıdaki Name Server (NS) adreslerini tanımlayın. Bu işlemden sonra domaininiz otomatik olarak aktif olacaktır.' 
                              : 'Set the following Name Server (NS) addresses in your domain registrar panel. Your domain will be activated automatically after this.'}
                          </p>
                          <div className="space-y-2 pt-2">
                            {cfNameServers.map((ns, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-100">
                                <span className="text-[10px] font-bold text-slate-500">NS {idx + 1}:</span>
                                <code 
                                  className="font-mono font-bold text-indigo-600 select-all cursor-pointer" 
                                  onClick={() => { 
                                    navigator.clipboard.writeText(ns); 
                                    alert(lang === 'tr' ? 'Kopyalandı!' : 'Copied!'); 
                                  }}
                                >
                                  {ns}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cfStatus.status === 'active' && (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center space-x-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <p className="text-xs font-bold text-emerald-900">
                            {lang === 'tr' ? 'Domaininiz başarıyla bağlandı ve aktif!' : 'Your domain is successfully connected and active!'}
                          </p>
                        </div>
                      )}

                      {cfStatus.status === 'manual' && (
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                          <div className="flex items-center space-x-3">
                            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                            <p className="text-xs font-bold text-indigo-900">
                              {lang === 'tr' ? 'Domain Kaydedildi' : 'Domain Saved'}
                            </p>
                          </div>
                          <p className="text-[10px] text-indigo-600 leading-relaxed">
                            {lang === 'tr' 
                              ? 'Domaininiz sisteme kaydedildi. Şimdi domain panelinizden A kaydını 216.24.57.1 IP adresine yönlendirdiğinizden emin olun.' 
                              : 'Your domain has been saved. Please ensure you have pointed the A record to 216.24.57.1 in your domain panel.'}
                          </p>
                          <button 
                            onClick={() => setCfStatus(null)}
                            className="text-[10px] font-bold text-indigo-600 underline"
                          >
                            {lang === 'tr' ? 'Ayarları Sıfırla' : 'Reset Settings'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'web' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-6 pb-20"
        >
          {/* Main Visual Control Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Showcase & Layout Controls */}
            <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  {lang === 'tr' ? 'VİTRİN VE TASARIM' : 'SHOWCASE & DESIGN'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  { key: 'show_announcement', label: lang === 'tr' ? 'Duyuru Bandı' : 'Announcement Bar', icon: <RefreshCw className="w-3.5 h-3.5" /> },
                  { key: 'show_stories', label: lang === 'tr' ? 'Hikayeler' : 'Stories', icon: <ImageIcon className="w-3.5 h-3.5" /> },
                  { key: 'show_campaigns', label: lang === 'tr' ? 'Kampanyalar' : 'Campaigns', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                  { key: 'show_testimonials', label: lang === 'tr' ? 'Müşteri Yorumları' : 'Testimonials', icon: <User className="w-3.5 h-3.5" /> },
                  { key: 'show_newsletter', label: lang === 'tr' ? 'Haber Bülteni' : 'Newsletter', icon: <Mail className="w-3.5 h-3.5" /> },
                  { key: 'enable_live_activity', label: lang === 'tr' ? 'Canlı Aktivite' : 'Live Activity', icon: <Smartphone className="w-3.5 h-3.5" /> },
                  { key: 'show_featured_only', label: lang === 'tr' ? 'Fiyatı Düşenler (Fırsat)' : 'Featured Deals', icon: <Star className="w-3.5 h-3.5" />, color: 'text-amber-500' },
                ].map((section) => (
                  <div key={section.key} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-white rounded-lg shadow-sm border border-slate-100 ${section.color || 'text-slate-400'}`}>
                        {section.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{section.label}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const currentLayout = branding.page_layout_settings || {};
                        onBrandingChange('page_layout_settings', { ...currentLayout, [section.key]: currentLayout[section.key as keyof typeof currentLayout] === false ? true : false });
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${branding.page_layout_settings?.[section.key] !== false ? (section.color ? 'bg-amber-500' : 'bg-indigo-600') : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${branding.page_layout_settings?.[section.key] !== false ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
              
              {branding.page_layout_settings?.show_announcement !== false && (
                <div className="mb-6 p-4 bg-white border border-slate-200 rounded-2xl">
                  <label className="text-xs font-bold text-slate-500 mb-2 block">{lang === 'tr' ? 'Duyuru Metni' : 'Announcement Text'}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                    placeholder={lang === 'tr' ? 'Duyuru metnini buraya yazın...' : 'Enter announcement text here...'}
                    value={branding.page_layout_settings?.announcement_text || ''}
                    onChange={(e) => onBrandingChange('page_layout_settings', { ...branding.page_layout_settings, announcement_text: e.target.value })}
                  />
                </div>
              )}

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{lang === 'tr' ? 'TEMA KONSEPTİ' : 'THEME CONCEPT'}</p>
                <div className="flex gap-2">
                  {['modern', 'minimal', 'bold', 'luxury'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => onBrandingChange('page_layout_settings', { ...(branding.page_layout_settings || {}), theme_variety: theme })}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${branding.page_layout_settings?.theme_variety === theme ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 mt-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{lang === 'tr' ? 'SEKTÖR MODU' : 'SECTOR MODE'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {['general', 'fashion', 'automotive', 'tech'].map((sect) => (
                    <button
                      key={sect}
                      onClick={() => onBrandingChange('page_layout_settings', { ...(branding.page_layout_settings || {}), sector: sect })}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${branding.page_layout_settings?.sector === sect ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                    >
                      {sect === 'general' ? (lang === 'tr' ? 'Genel' : 'General') :
                       sect === 'fashion' ? (lang === 'tr' ? 'Moda / Lüks' : 'Fashion / Luxury') :
                       sect === 'automotive' ? (lang === 'tr' ? 'Otomotiv' : 'Automotive') :
                       (lang === 'tr' ? 'Teknoloji' : 'Tech')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Logo & Favicon (Compact Side-by-Side) */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  {lang === 'tr' ? 'MARKA KİMLİĞİ' : 'BRAND ASSETS'}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Logo Upload */}
                  <div className="relative group aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 hover:border-indigo-400 hover:bg-white transition-all cursor-pointer">
                    {branding.logo_url ? (
                      <img src={branding.logo_url} alt="Logo" className="max-h-full max-w-full object-contain mb-1" />
                    ) : (
                      <Plus className="w-6 h-6 text-slate-300" />
                    )}
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">LOGO</span>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={onLogoUpload} />
                  </div>

                  {/* Favicon Upload */}
                  <div className="relative group aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 hover:border-amber-400 hover:bg-white transition-all cursor-pointer">
                    {branding.favicon_url ? (
                      <img src={branding.favicon_url} alt="Favicon" className="w-10 h-10 object-contain mb-1" />
                    ) : (
                      <Plus className="w-6 h-6 text-slate-300" />
                    )}
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">FAVICON</span>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={onFaviconUpload} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 uppercase tracking-widest">
                    <p className="text-[8px] font-black text-slate-400 mb-1">LOGO URL</p>
                    <input className="w-full bg-transparent text-[10px] text-slate-600 outline-none font-mono" value={branding.logo_url || ''} onChange={(e) => onBrandingChange('logo_url', e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 uppercase tracking-widest">
                    <p className="text-[8px] font-black text-slate-400 mb-1">FAVICON URL</p>
                    <input className="w-full bg-transparent text-[10px] text-slate-600 outline-none font-mono" value={branding.favicon_url || ''} onChange={(e) => onBrandingChange('favicon_url', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
            </div>
          </div>

          {/* Banner & Text Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">{lang === 'tr' ? 'AFİŞ VE BAŞLIKLAR' : 'BANNER & TITLES'}</h3>
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'MAĞAZA ADI' : 'STORE NAME'}</label>
                      <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={branding.name || ''} onChange={(e) => onBrandingChange('name', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'HERO BAŞLIK' : 'HERO TITLE'}</label>
                      <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={branding.hero_title || ''} onChange={(e) => onBrandingChange('hero_title', e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="relative group w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
                    {branding.hero_image_url ? (
                      <img src={branding.hero_image_url} alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-slate-300 mb-1" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">BANNER</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={onBannerUpload} />
                  </div>
                  <input className="w-full px-4 py-2 bg-slate-100/50 border-none rounded-lg text-[10px] font-mono text-slate-400" value={branding.hero_image_url || ''} onChange={(e) => onBrandingChange('hero_image_url', e.target.value)} placeholder="Banner URL..." />
               </div>
            </div>

            {/* Label Customization */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{lang === 'tr' ? 'ÖZEL ETİKETLER' : 'CUSTOM LABELS'}</h3>
                 <div className="flex gap-2">
                   <button 
                    onClick={() => {
                      onBrandingChange('brand_label', lang === 'tr' ? 'Yazarlar' : 'Authors');
                      onBrandingChange('category_label', lang === 'tr' ? 'Kitap Türleri' : 'Book Types');
                      onBrandingChange('product_label', lang === 'tr' ? 'Kitap' : 'Book');
                      onBrandingChange('stock_label', lang === 'tr' ? 'Stoktaki Kitap Sayısı' : 'Books in Stock');
                      onBrandingChange('hero_title', lang === 'tr' ? 'Okumayı Seviyoruz' : 'We Love Reading');
                    }}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-indigo-100 transition-colors"
                   >
                     {lang === 'tr' ? 'Kitapçı Konsepti Uygula' : 'Apply Bookstore Concept'}
                   </button>
                 </div>
               </div>
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'MARKA ETİKETİ' : 'BRAND LABEL'}</label>
                      <input 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" 
                        placeholder={lang === 'tr' ? 'Örn: Yazarlar' : 'e.g. Authors'}
                        value={branding.brand_label || ''} 
                        onChange={(e) => onBrandingChange('brand_label', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'KATEGORİ ETİKETİ' : 'CATEGORY LABEL'}</label>
                      <input 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" 
                        placeholder={lang === 'tr' ? 'Örn: Koleksiyon' : 'e.g. Collections'}
                        value={branding.category_label || ''} 
                        onChange={(e) => onBrandingChange('category_label', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ÜRÜN ADLANDIRMA' : 'PRODUCT LABEL'}</label>
                       <input 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" 
                         placeholder={lang === 'tr' ? 'Örn: Kitap' : 'e.g. Book'}
                         value={branding.product_label || ''} 
                         onChange={(e) => onBrandingChange('product_label', e.target.value)} 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'STOK ETİKETİ' : 'STOCK LABEL'}</label>
                       <input 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" 
                         placeholder={lang === 'tr' ? 'Örn: Kalan Adet' : 'e.g. Remaining'}
                         value={branding.stock_label || ''} 
                         onChange={(e) => onBrandingChange('stock_label', e.target.value)} 
                       />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                    {lang === 'tr' 
                      ? '* Bu ayarlar web sitenizdeki filtreleme ve ürün detaylarındaki başlıkları değiştirir.' 
                      : '* These settings change the titles in filtering and product details on your website.'}
                  </p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">{lang === 'tr' ? 'HAKKIMIZDA METNİ' : 'ABOUT TEXT'}</h3>
               <textarea 
                  className="w-full h-[180px] p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                  value={branding.about_text || ''}
                  onChange={(e) => onBrandingChange('about_text', e.target.value)}
                  placeholder={lang === 'tr' ? 'Mağazanız hakkında kısa bir bilgi yazın...' : 'Write some info about your store...'}
               />
            </div>
          </div>

          {/* Contact & Social Compact */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100/50">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Contact */}
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{lang === 'tr' ? 'İLETİŞİM BİLGİLERİ' : 'CONTACT INFO'}</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'E-POSTALARI YÖNET' : 'MANAGE EMAILS'}</p>
                         {emails.map((email, idx) => (
                            <div key={idx} className="flex gap-2">
                               <input className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" value={email} onChange={(e) => updateEmail(idx, e.target.value)} />
                               {emails.length > 1 && <button onClick={() => removeEmail(idx)} className="text-rose-500"><X /></button>}
                            </div>
                         ))}
                         <button onClick={addEmail} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">+ {lang === 'tr' ? 'EKLE' : 'ADD'}</button>
                      </div>
                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'TELEFONLARI YÖNET' : 'MANAGE PHONES'}</p>
                         {phones.map((phone, idx) => (
                            <div key={idx} className="flex gap-2">
                               <input className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" value={phone} onChange={(e) => updatePhone(idx, e.target.value)} />
                               {phones.length > 1 && <button onClick={() => removePhone(idx)} className="text-rose-500"><X /></button>}
                            </div>
                         ))}
                         <button onClick={addPhone} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">+ {lang === 'tr' ? 'EKLE' : 'ADD'}</button>
                      </div>
                   </div>
                </div>

                {/* Social */}
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">{lang === 'tr' ? 'SOSYAL MEDYA' : 'SOCIAL MEDIA'}</h4>
                   <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: <Instagram className="w-4 h-4" />, key: 'instagram_url', placeholder: '@username' },
                        { icon: <Facebook className="w-4 h-4" />, key: 'facebook_url', placeholder: 'facebook.com/...' },
                        { icon: <Twitter className="w-4 h-4" />, key: 'twitter_url', placeholder: '@twitter' },
                        { icon: <MessageCircle className="w-4 h-4" />, key: 'whatsapp_number', placeholder: '+90...' },
                      ].map((social) => (
                        <div key={social.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="text-slate-400">{social.icon}</div>
                           <input 
                              className="w-full bg-transparent text-xs font-bold outline-none placeholder:text-slate-300" 
                              placeholder={social.placeholder} 
                              value={branding[social.key as keyof typeof branding] || ''} 
                              onChange={(e) => onBrandingChange(social.key as any, e.target.value)} 
                           />
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Tracking & Analytics */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                {lang === 'tr' ? 'İZLEME VE ANALİTİK' : 'TRACKING & ANALYTICS'}
             </h3>
             <p className="text-xs text-slate-500 mb-6 font-medium">
               {lang === 'tr' ? 'Google Analytics veya Google Tag Manager (GTM) aracılığıyla mağazanızı dijital olarak analiz edin.' : 'Analyze your store digitally through Google Analytics or Google Tag Manager (GTM).'}
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Google Analytics (gtag) ID
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold font-mono placeholder:text-slate-300" 
                    placeholder="G-XXXXXXXXXX" 
                    value={(branding.meta_settings && typeof branding.meta_settings === 'object' && !Array.isArray(branding.meta_settings)) ? branding.meta_settings.ga_measurement_id || '' : ''} 
                    onChange={(e) => {
                      const newSettings = { ...(branding.meta_settings || {}) };
                      newSettings.ga_measurement_id = e.target.value;
                      onBrandingChange('meta_settings', newSettings);
                    }} 
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">
                    Örn: G-XXXXXXXXXX. Sadece ID'yi girin.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Google Tag Manager (GTM) ID
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold font-mono placeholder:text-slate-300" 
                    placeholder="GTM-XXXXXXX" 
                    value={(branding.meta_settings && typeof branding.meta_settings === 'object' && !Array.isArray(branding.meta_settings)) ? branding.meta_settings.gtm_id || '' : ''} 
                    onChange={(e) => {
                      const newSettings = { ...(branding.meta_settings || {}) };
                      newSettings.gtm_id = e.target.value;
                      onBrandingChange('meta_settings', newSettings);
                    }} 
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">
                    Örn: GTM-XXXXXXX. Sadece ID'yi girin.
                  </p>
                </div>
             </div>
          </div>

          {/* User Management Section (Keep it simple here) */}
          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-white/10 transition-all duration-1000"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-white tracking-widest uppercase mb-1">{lang === 'tr' ? 'EKİP YÖNETİMİ' : 'TEAM MANAGEMENT'}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{lang === 'tr' ? 'MAĞAZA ERİŞİM YETKİLERİ' : 'STORE ACCESS CONTROL'}</p>
                </div>
                {(currentUser?.role === 'admin' || currentUser?.role === 'storeadmin' || currentUser?.role === 'superadmin') && (
                  <button onClick={onAddUser} className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-black/20">
                    + {lang === 'tr' ? 'YENİ ÜYE' : 'NEW MEMBER'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u) => (
                  <div key={u.id} className="p-5 bg-slate-800/50 rounded-3xl border border-slate-700/50 flex items-center justify-between group/user hover:bg-slate-800 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center text-white font-black">
                          {u.email?.[0].toUpperCase()}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-white leading-none mb-1">{u.email.split('@')[0]}</p>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{u.role}</p>
                       </div>
                    </div>
                    {((currentUser?.role === 'admin' || currentUser?.role === 'storeadmin' || currentUser?.role === 'superadmin') && u.id !== currentUser?.id) && (
                       <button onClick={() => onDeleteUser(u.id)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                          <Lock className="w-4 h-4" />
                       </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/40 backdrop-blur-2xl border-t border-slate-200/50 flex justify-center lg:justify-end lg:pr-12 pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={onSaveBranding}
            className="flex items-center space-x-4 px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-sm hover:bg-indigo-600 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:shadow-indigo-500/40 active:scale-95 group border border-white/10"
          >
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Save className="h-4 w-4 text-white" />
            </div>
            <span className="uppercase tracking-[0.2em]">{translations[lang]?.dashboard?.saveSettings || 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
