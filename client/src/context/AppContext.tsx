// client/src/context/AppContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, type Language, type TranslationKey } from "@/lib/translations";
// REMOVED: All keycloak-js imports removed per requirements

export interface User {
  id?: string;
  username: string;
  email?: string;
}

interface AppContextType {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  loginUser: (user: User, token?: string | null, rememberMe?: boolean) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  authToken: string | null;

  // i18n
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;

  // Remember-me (Info)
  rememberMe: boolean;
}

const USER_KEY = "app_user";
const AUTH_TOKEN_KEY = "app_auth_token";
const REMEMBER_KEY = "remember_me";
const LANG_KEY = "language";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Sprache
  const [language, setLanguage] = useState<Language>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LANG_KEY) : null;
    return saved === "de" || saved === "en" ? saved : "en";
  });
  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
  }, [language]);

  // Remember me Flag
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(REMEMBER_KEY) : null;
    return saved === "true";
  });

  // Helper: welche Storage-Quelle nutzen?
  const getStore = (remember: boolean) => (remember ? localStorage : sessionStorage);

  // User initialisieren
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const raw =
        (rememberMe ? localStorage.getItem(USER_KEY) : sessionStorage.getItem(USER_KEY)) ??
        localStorage.getItem(USER_KEY) ?? // Fallback falls Flag gewechselt wurde
        null;
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  // Token initialisieren (optional – wenn du session-cookie nutzt, bleibt das leer)
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return (
        (rememberMe ? localStorage.getItem(AUTH_TOKEN_KEY) : sessionStorage.getItem(AUTH_TOKEN_KEY)) ??
        localStorage.getItem(AUTH_TOKEN_KEY) ??
        null
      );
    } catch {
      return null;
    }
  });

  // persist helpers
  const clearAllAuthStorage = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const persistAuth = (u: User | null, token: string | null, remember: boolean) => {
    // immer erst leeren, dann gezielt schreiben
    clearAllAuthStorage();
    const store = getStore(remember);
    if (u) store.setItem(USER_KEY, JSON.stringify(u));
    if (token) store.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(REMEMBER_KEY, String(remember));
  };

  // Public API
  const loginUser = (u: User, token: string | null = null, remember: boolean = rememberMe) => {
    setRememberMe(remember);
    setUserState(u);
    setAuthToken(token ?? null);
    persistAuth(u, token ?? null, remember);
  };

  const setUser = (u: User | null) => {
    setUserState(u);
    // Token bleibt wie er ist
    persistAuth(u, authToken, rememberMe);
  };

  const logout = async () => {
    setUserState(null);
    setAuthToken(null);
    setRememberMe(false);
    clearAllAuthStorage();
    
    // Keycloak logout would be handled here if direct integration was enabled
    // Currently using backend-based authentication with session cookies
  };

  const isAuthenticated = !!user;

  const t = (key: TranslationKey): string =>
    translations[language][key] || translations.en[key] || key;

  const value = useMemo<AppContextType>(
    () => ({
      user,
      isAuthenticated,
      loginUser,
      setUser,
      logout,
      authToken,
      language,
      setLanguage,
      t,
      rememberMe,
    }),
    [user, isAuthenticated, authToken, language, rememberMe]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}