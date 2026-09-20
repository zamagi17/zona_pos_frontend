import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutletId, setSelectedOutletId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('zona_pos_token');
    if (token) {
      api.getCurrentUser()
        .then(u => {
          setUser(u);
          const savedOutlet = localStorage.getItem('zona_pos_outlet_id');
          if (savedOutlet) {
            setSelectedOutletId(Number(savedOutlet));
          } else if (u.outletId) {
            setSelectedOutletId(u.outletId);
          }
        })
        .catch(() => {
          localStorage.removeItem('zona_pos_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    localStorage.setItem('zona_pos_token', res.token);
    setUser(res.user);
    if (res.user.outletId) {
      setSelectedOutletId(res.user.outletId);
      localStorage.setItem('zona_pos_outlet_id', res.user.outletId);
    }
    return res;
  };

  const registerTenant = async (data) => {
    const res = await api.registerTenant(data);
    localStorage.setItem('zona_pos_token', res.token);
    setUser(res.user);
    if (res.user.outletId) {
      setSelectedOutletId(res.user.outletId);
      localStorage.setItem('zona_pos_outlet_id', res.user.outletId);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('zona_pos_token');
    localStorage.removeItem('zona_pos_outlet_id');
    setUser(null);
    setSelectedOutletId(null);
  };

  const switchOutlet = (outletId) => {
    setSelectedOutletId(outletId);
    localStorage.setItem('zona_pos_outlet_id', outletId);
  };

  return (
    <AuthContext.Provider value={{ user, loading, selectedOutletId, login, registerTenant, logout, switchOutlet }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
