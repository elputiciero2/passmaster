import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('passmaster_token');
    const storedUser = localStorage.getItem('passmaster_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('passmaster_token');
        localStorage.removeItem('passmaster_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    const { user, token } = res.data;
    localStorage.setItem('passmaster_token', token);
    localStorage.setItem('passmaster_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    const { user, token } = res.data;
    localStorage.setItem('passmaster_token', token);
    localStorage.setItem('passmaster_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('passmaster_token');
    localStorage.removeItem('passmaster_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
