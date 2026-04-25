"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";

export type UserRole = "owner" | "consumer" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const roleConfig: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  owner: { label: "OWNER", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
  consumer: { label: "CONSUMER", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  admin: { label: "ADMIN", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200" },
};

export const rolePages: Record<UserRole, string[]> = {
  owner: ["dashboard", "apis", "api-keys", "analytics", "billing", "settings"],
  consumer: ["overview", "my-api-keys", "usage-history"],
  admin: ["all-users", "all-apis", "system-stats"],
};

export const roleDefaultPage: Record<UserRole, string> = {
  owner: "dashboard",
  consumer: "overview",
  admin: "all-users",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);

  const login = useCallback((email: string, role: UserRole) => {
    const id = crypto.randomUUID?.() ?? `${Date.now()}`;
    const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setUser({ id, email, name, role });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
