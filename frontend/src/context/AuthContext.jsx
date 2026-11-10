import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { initSocket, disconnectSocket } from '../services/socket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session on startup
  useEffect(() => {
    let mounted = true;
    api.getMe()
      .then((res) => {
        if (mounted && res?.data?.user) {
          setUser(res.data.user);
          initSocket();
        }
      })
      .catch((err) => {
        // Unauthenticated is expected if no session exists yet
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    const loggedUser = res?.data?.user;
    setUser(loggedUser);
    initSocket();
    return loggedUser;
  };

  const register = async (data) => {
    const res = await api.register(data);
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      disconnectSocket();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
