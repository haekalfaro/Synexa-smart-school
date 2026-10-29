import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try { await api.post('/logout'); } catch { /* token sudah tidak berlaku */ }
    localStorage.removeItem('token');
    setUser(null);
  };

  const canWrite = !!user && ['admin', 'operator'].includes(user.role);

  return <Ctx.Provider value={{ user, loading, login, logout, canWrite }}>{children}</Ctx.Provider>;
}
