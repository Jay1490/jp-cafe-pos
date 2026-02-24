import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, settingsAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('cafe_token'));
  const [loading, setLoading] = useState(true);
  const [cafeName, setCafeName] = useState('JAY CAFÉ');

  useEffect(() => {
    const init = async () => {
      // Load public cafe name for login screen
      try {
        const res = await settingsAPI.getPublic();
        if (res.data?.data?.cafeName) setCafeName(res.data.data.cafeName);
      } catch {}

      // Verify existing token
      if (token) {
        try {
          const res = await authAPI.verify(token);
          if (!res.data?.valid) {
            sessionStorage.removeItem('cafe_token');
            setToken(null);
          }
        } catch {
          sessionStorage.removeItem('cafe_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (pin) => {
    const res = await authAPI.login(pin);
    const { token: t, cafeName: cn } = res.data;
    sessionStorage.setItem('cafe_token', t);
    setToken(t);
    if (cn) setCafeName(cn);
    return res.data;
  };

  const logout = () => {
    sessionStorage.removeItem('cafe_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isLoggedIn: !!token, loading, login, logout, cafeName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
