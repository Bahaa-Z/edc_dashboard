import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from '@/lib/translations';

interface User {
  id: string;
  username: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'de' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const isAuthenticated = user !== null;

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      language,
      setLanguage,
      t,
      isAuthenticated
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
