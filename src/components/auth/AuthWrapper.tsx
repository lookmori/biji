"use client";

import { AuthProvider } from "./AuthContext";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
