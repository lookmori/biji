"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, type User } from "@/lib/api-client";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null, loading: true,
  login: async () => {}, register: async () => {}, logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：检查登录状态
  useEffect(() => {
    api.auth.me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const data = await api.auth.register({ email, password, name });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
