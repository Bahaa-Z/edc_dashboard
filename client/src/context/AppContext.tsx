// client/src/context/AppContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, type Language, type TranslationKey } from "@/lib/translations";
import { keycloak, initKeycloak, login, logout as keycloakLogout, getUserProfile, setupTokenRefresh } from "@/auth/keycloak";

export interface User {
  id?: string;
  username: string;
  email?: string;
}

interface AppContextType {
  // Auth - Keycloak-based
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  authToken: string | null;
  refreshToken: () => Promise<boolean>;

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

  // Keycloak state
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Initialize Keycloak on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('[AUTH] Initializing Keycloak...');
        const authenticated = await initKeycloak();
        
        if (authenticated && keycloak.tokenParsed) {
          // Extract user info from token
          const userInfo = getUserProfile();
          const userData: User = {
            id: keycloak.subject || '',
            username: userInfo.preferred_username || userInfo.email || 'Unknown',
            email: userInfo.email
          };
          
          setUser(userData);
          setAuthToken(keycloak.token || null);
          console.log('[AUTH] User authenticated:', userData);
          
          // Setup token refresh
          setupTokenRefresh();
        } else {
          console.log('[AUTH] User not authenticated');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('[AUTH] Keycloak initialization failed:', error);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Login function
  const handleLogin = async (): Promise<void> => {
    try {
      await login();
    } catch (error) {
      console.error('[AUTH] Login failed:', error);
    }
  };

  // Logout function
  const handleLogout = async (): Promise<void> => {
    try {
      setUser(null);
      setAuthToken(null);
      await keycloakLogout();
    } catch (error) {
      console.error('[AUTH] Logout failed:', error);
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const success = await keycloak.updateToken(30);
      if (success && keycloak.token) {
        setAuthToken(keycloak.token);
      }
      return success;
    } catch (error) {
      console.error('[AUTH] Token refresh failed:', error);
      return false;
    }
  };

  const isAuthenticated = !!user && !!keycloak.authenticated;

  const t = (key: TranslationKey): string =>
    translations[language][key] || translations.en[key] || key;

  const value = useMemo<AppContextType>(
    () => ({
      user,
      isAuthenticated,
      isInitialized,
      login: handleLogin,
      logout: handleLogout,
      authToken,
      refreshToken,
      language,
      setLanguage,
      t,
    }),
    [user, isAuthenticated, isInitialized, authToken, language]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}