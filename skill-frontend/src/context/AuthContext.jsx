import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("skill_token"));
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.me(token)
      .then((data) => { if (data.error) logout(); else setUser(data); })
      .finally(() => setLoading(false));

    const loadUnread = async () => {
      try {
        const data = await api.getChatUnreadCount(token);
        setChatUnreadCount(data?.unreadCount || 0);
      } catch {}
    };
    loadUnread();
    const id = setInterval(loadUnread, 10000);
    return () => clearInterval(id);
  }, [token]);

  useEffect(() => {
    if (token && user) {
      api.getProfile(token).then(setProfile);
    }
    const profileInterval = setInterval(() => {
      if (token) api.getProfile(token).then(setProfile).catch(() => {});
    }, 30000);
    return () => clearInterval(profileInterval);
  }, [token, user]);

  useEffect(() => {
    const handler = () => {
      if (token) api.getProfile(token).then(setProfile).catch(() => {});
    };
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, [token]);

  const refreshProfile = useCallback(() => {
    if (token) api.getProfile(token).then(setProfile);
  }, [token]);

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
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, profile, setProfile, refreshProfile, chatUnreadCount, setChatUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
