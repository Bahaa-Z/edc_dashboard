import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, ChevronDown } from "lucide-react";
import { getUser, logout } from "@/auth/keycloak";
import { useState, useEffect } from "react";
import { translations, type Language, type TranslationKey } from "@/lib/translations";

export function TopBar() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("language") : null;
    return saved === "de" || saved === "en" ? saved : "en";
  });
  
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    localStorage.setItem("language", language);
    const keycloakUser = getUser();
    setUser(keycloakUser);
  }, [language]);

  const t = (key: TranslationKey) => translations[language][key];

  const handleLogout = () => {
    console.log('[TOPBAR] User clicked logout, redirecting to Keycloak logout');
    logout(); // Redirect to Keycloak logout page
  };

  return (
    <header className="bg-gradient-to-r from-white to-gray-50 shadow-lg border-b border-gray-100 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        {/* Left side: App Branding */}
        <div className="flex items-center space-x-3" data-testid="app-branding">
          <img 
            src="/ARENA2036_logomark_orange.svg" 
            alt="ARENA2036 Logo"
            className="h-8 w-auto"
          />
          <h1 className="text-xl font-bold text-gray-800">
            ARENA2036 EDC Management Console
          </h1>
        </div>
        
        {/* Right side: Language Toggle and User Profile */}
        <div className="flex items-center space-x-6">
        {/* Language Toggle */}
        <div className="flex bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1 shadow-sm" data-testid="language-toggle">
          <Button
            variant={language === "en" ? "default" : "ghost"}
            size="sm"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              language === "en" 
                ? "bg-white shadow-md text-gray-800 hover:shadow-lg" 
                : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
            }`}
            onClick={() => setLanguage("en")}
            data-testid="lang-en"
          >
            EN
          </Button>
          <Button
            variant={language === "de" ? "default" : "ghost"}
            size="sm"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              language === "de" 
                ? "bg-white shadow-md text-gray-800 hover:shadow-lg" 
                : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
            }`}
            onClick={() => setLanguage("de")}
            data-testid="lang-de"
          >
            DE
          </Button>
        </div>
        
        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 bg-white/50 hover:bg-white shadow-sm hover:shadow-md rounded-xl px-4 py-2 transition-all duration-200"
              data-testid="user-menu-trigger"
            >
              <div className="p-1 bg-[var(--arena-orange)] bg-opacity-10 rounded-full">
                <User className="h-4 w-4 text-[var(--arena-orange)]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium text-sm">
                  {user?.given_name && user?.family_name 
                    ? `${user.given_name} ${user.family_name}`
                    : user?.username || t("user")
                  }
                </span>
                <span className="text-xs text-gray-500">EDC Admin</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white shadow-xl border border-gray-100 rounded-xl">
            <DropdownMenuItem onClick={handleLogout} data-testid="logout-button" className="px-4 py-3 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg m-1">
              <User className="h-4 w-4 mr-3" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
