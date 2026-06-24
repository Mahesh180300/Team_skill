import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("skill_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.me(token)
      .then((data) => { if (data.error) logout(); else setUser(data); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (!data.token) {
      const msg = Array.isArray(data.message) ? data.message[0] : data.message;
      throw new Error(msg || 'Login failed');
    }
    localStorage.setItem("skill_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const data = await api.register(formData);
    if (data.error) throw new Error(data.error);
    localStorage.setItem("skill_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("skill_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
