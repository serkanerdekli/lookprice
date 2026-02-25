// App.tsx dosyanızın en başındaki state tanımlamalarını şu şekilde güncelleyin:

export default function App() {
  // localStorage hatalarını önlemek için güvenli okuma
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem("token"); } catch { return null; }
  });
  
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // ... geri kalan kodlarınız aynı kalabilir ...
