"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { useAppStore, type PageId } from "@/lib/store";
import {
  roleConfig,
  roleDefaultPage,
  rolePages,
  type User,
  type UserRole,
} from "@/lib/auth-model";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string; role: UserRole }) => Promise<User>;
  register: (details: { name: string; email: string; password: string; role: UserRole; username?: string }) => Promise<User>;
  updateProfile: (profile: { name: string; email: string; company: string; timezone: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export type { User, UserRole } from "@/lib/auth-model";
export { roleConfig, roleDefaultPage, rolePages } from "@/lib/auth-model";

async function readJsonError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setCurrentPage = useAppStore((state) => state.setCurrentPage);

  const syncDefaultPage = useCallback(
    (nextUser: User | null) => {
      if (!nextUser) return;
      setCurrentPage(roleDefaultPage[nextUser.role] as PageId);
    },
    [setCurrentPage]
  );

  // On mount: check if we already have a valid session cookie via /api/auth/me
  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (ignore) return;

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = (await response.json()) as { user: User };

        if (!ignore) {
          setUser(data.user);
          syncDefaultPage(data.user);
        }
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadSession();
    return () => { ignore = true; };
  }, [syncDefaultPage]);

  // --------------------------------------------------------------------------
  // Login: Firebase Auth first, then our Next.js session API
  // --------------------------------------------------------------------------
  const login = useCallback(
    async (credentials: { email: string; password: string; role: UserRole }) => {
      // 1. Authenticate with Firebase
      const fbCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        credentials.email,
        credentials.password
      );
      const idToken = await fbCredential.user.getIdToken();

      // 2. Exchange Firebase ID token for a StratAPI session cookie
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idToken,
          role: credentials.role,
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        // Sign out of Firebase if our backend rejected the request
        await firebaseSignOut(firebaseAuth).catch(() => {});
        throw new Error(await readJsonError(response));
      }

      const data = (await response.json()) as { user: User };
      setUser(data.user);
      syncDefaultPage(data.user);
      return data.user;
    },
    [syncDefaultPage]
  );

  // --------------------------------------------------------------------------
  // Register: Firebase Auth first, then our Next.js session API
  // --------------------------------------------------------------------------
  const register = useCallback(
    async (details: { name: string; email: string; password: string; role: UserRole; username?: string }) => {
      // 1. Create Firebase account
      const fbCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        details.email,
        details.password
      );
      const idToken = await fbCredential.user.getIdToken();

      // 2. Create the StratAPI account (SQLite + MongoDB) and get a session
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...details, idToken }),
      });

      if (!response.ok) {
        // Roll back the Firebase account so the user can retry cleanly
        await fbCredential.user.delete().catch(() => {});
        throw new Error(await readJsonError(response));
      }

      const data = (await response.json()) as { user: User };
      setUser(data.user);
      syncDefaultPage(data.user);
      return data.user;
    },
    [syncDefaultPage]
  );

  // --------------------------------------------------------------------------
  // Update profile
  // --------------------------------------------------------------------------
  const updateProfile = useCallback(
    async (profile: { name: string; email: string; company: string; timezone: string }) => {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error(await readJsonError(response));

      const data = (await response.json()) as { user: User };
      setUser(data.user);
      return data.user;
    },
    []
  );

  // --------------------------------------------------------------------------
  // Logout
  // --------------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await Promise.all([
        fetch("/api/auth/logout", { method: "POST", credentials: "include" }),
        firebaseSignOut(firebaseAuth),
      ]);
    } finally {
      setUser(null);
      setCurrentPage("dashboard");
    }
  }, [setCurrentPage]);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, register, updateProfile, logout }),
    [user, isLoading, login, register, updateProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
