import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/context/AppContext";
import { User, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";

export function TopBar() {
  const { t, language, setLanguage, setUser } = useApp();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-end space-x-4">
        {/* Language Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1" data-testid="language-toggle">
          <Button
            variant={language === "en" ? "default" : "ghost"}
            size="sm"
            className={`px-3 py-1 text-sm font-medium ${
              language === "en" 
                ? "bg-white shadow-sm text-gray-700" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setLanguage("en")}
            data-testid="lang-en"
          >
            EN
          </Button>
          <Button
            variant={language === "de" ? "default" : "ghost"}
            size="sm"
            className={`px-3 py-1 text-sm font-medium ${
              language === "de" 
                ? "bg-white shadow-sm text-gray-700" 
                : "text-gray-500 hover:text-gray-700"
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
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              data-testid="user-menu-trigger"
            >
              <User className="h-5 w-5" />
              <span className="font-medium">{t("user")}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
