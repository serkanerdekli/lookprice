const StoreDashboard = ({ token, user }: { token: string, user: User }) => {
  const { storeId: paramStoreId } = useParams();
  const effectiveStoreId = user.role === 'superadmin' ? paramStoreId : user.store_id;

  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'branding' | 'users'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [branding, setBranding] = useState({ logo_url: "", primary_color: "#4f46e5" });
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

  const isViewer = user.role === 'viewer';
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
    setStoreUsers(data);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/api/store/users", { ...newUser, storeId: effectiveStoreId }, token);
    if (res.success) {
      setShowAddUser(false);
      setNewUser({ email: "", password: "", role: "editor" });
      fetchStoreUsers();
    } else { alert(res.error || "Kullanıcı eklenemedi"); }
  };

  const fetchStoreInfo = async () => {
    const url = effectiveStoreId ? `/api/store/info?storeId=${effectiveStoreId}` : "/api/store/info";
    const data = await api.get(url, token);
    if (data && data.slug) {
      setStoreSlug(data.slug);
      setBranding({ logo_url: data.logo_url || "", primary_color: data.primary_color || "#4f46e5" });
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
    setProducts(data);
    setLoading(false);
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/api/store/products", { ...newProduct, storeId: effectiveStoreId }, token);
    if (res.success) {
      setShowAddManual(false);
      setNewProduct({ barcode: "", name: "", price: "", description: "", currency: "TRY" });
      fetchProducts();
    } else { alert(res.error || "Ürün eklenemedi"); }
  };

  const scanUrl = `${window.location.origin}/scan/${storeSlug || 'demo'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mağaza Yönetimi</h1>
        <div className="flex space-x-2">
          {!isViewer && (
            <>
              <button onClick={() => setShowQR(true)} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold">QR Kod</button>
              <button onClick={() => setShowAddManual(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">Ürün Ekle</button>
            </>
          )}
        </div>
      </div>

      <div className="flex space-x-4 mb-8">
        <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'products' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Ürünler</button>
        <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Analizler</button>
        {isAdmin && <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Ekip</button>}
      </div>

      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Ürün Adı</th>
                <th className="p-4">Barkod</th>
                <th className="p-4">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 font-mono text-sm">{p.barcode}</td>
                  <td className="p-4 font-bold text-indigo-600">{p.price} {p.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl text-center max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Mağaza QR Kodu</h2>
            <div className="bg-gray-50 p-4 rounded-2xl inline-block mb-4">
              <QRCodeSVG value={scanUrl} size={200} />
            </div>
            <p className="text-xs text-gray-400 break-all mb-6">{scanUrl}</p>
            <button onClick={() => setShowQR(false)} className="w-full bg-gray-100 py-3 rounded-xl font-bold">Kapat</button>
          </div>
        </div>
      )}

      {showAddManual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-6">Yeni Ürün</h2>
            <form onSubmit={handleAddManual} className="space-y-4">
              <input required placeholder="Barkod" className="w-full p-3 bg-gray-50 border rounded-xl" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} />
              <input required placeholder="Ürün Adı" className="w-full p-3 bg-gray-50 border rounded-xl" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <input required type="number" placeholder="Fiyat" className="w-full p-3 bg-gray-50 border rounded-xl" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Kaydet</button>
              <button type="button" onClick={() => setShowAddManual(false)} className="w-full py-3 text-gray-400">İptal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
