// client/src/context/AppContext.tsx - EINFACH Session-based
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, type Language, type TranslationKey } from "@/lib/translations";

export interface User {
  id?: string;
  username: string;
  email?: string;
}

interface AppContextType {
  // Auth - Simple session-based
  user: User | null;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;

  // i18n
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LANG_KEY = "language";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LANG_KEY) : null;
    return saved === "de" || saved === "en" ? saved : "en";
  });
  
  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
  }, [language]);

  // Simple user state
  const [user, setUser] = useState<User | null>(null);

  // Check authentication status with backend
  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include" // Include session cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        console.log("[AUTH] User authenticated:", data.user.username);
      } else {
        setUser(null);
        console.log("[AUTH] User not authenticated");
      }
    } catch (error) {
      console.error("[AUTH] Check auth failed:", error);
      setUser(null);
    }
  };

  // Simple logout - call backend logout
  const logout = async () => {
    try {
      console.log("[LOGOUT] Logging out...");
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      setUser(null);
      window.location.reload(); // Refresh to show login page
    } catch (error) {
      console.error("[LOGOUT] Error:", error);
      setUser(null);
      window.location.reload();
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const isAuthenticated = !!user;

  const t = (key: TranslationKey): string =>
    translations[language][key] || translations.en[key] || key;

  const value = useMemo<AppContextType>(
    () => ({
      user,
      isAuthenticated,
      checkAuth,
      logout,
      language,
      setLanguage,
      t,
    }),
    [user, isAuthenticated, language]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}