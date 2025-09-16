import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Database, 
  Monitor, 
  FileText, 
  ArrowRightLeft, 
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react";

export function Sidebar() {
  const { t } = useApp();
  const [location, navigate] = useLocation();
  const [openMonitor, setOpenMonitor] = useState(false);

  // Hauptpunkte (ohne Monitor, da klappbar)
  const navItems = [
    { path: "/", label: t("dashboard"), icon: LayoutDashboard },
    { path: "/sde", label: t("sde"), icon: Database },
  ];

  // Subpunkte für Monitor
  const monitorItems = [
    { path: "/process-logs", label: t("processLogs"), icon: FileText },
    { path: "/edc-transactions", label: t("edcTransactions"), icon: ArrowRightLeft },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <div className="w-64 bg-gradient-to-b from-white to-gray-50 shadow-xl flex-shrink-0 border-r border-gray-200 h-full flex flex-col backdrop-blur">
        
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 pt-6">
        {/* Standard-Einträge */}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "default" : "ghost"}
              className={`w-full justify-start px-4 py-3 h-auto font-medium transition-all duration-200 rounded-xl ${
                isActive(item.path) 
                  ? "bg-gradient-to-r from-[var(--arena-orange)] to-orange-500 hover:from-[var(--arena-orange-hover)] hover:to-orange-600 text-white shadow-lg" 
                  : "text-gray-700 hover:bg-white hover:shadow-md"
              }`}
              onClick={() => navigate(item.path)}
              data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.label}
            </Button>
          );
        })}

        {/* Monitor klappbar */}
        <div>
          <Button
            variant="ghost"
            className={`w-full justify-between px-4 py-3 h-auto font-medium ${
              location.startsWith("/process-logs") || location.startsWith("/edc-transactions")
                ? "bg-[var(--arena-orange)] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setOpenMonitor(!openMonitor)}
          >
            <span className="flex items-center">
              <Monitor className="h-5 w-5 mr-3" />
              {t("monitor")}
            </span>
            {openMonitor ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>

          {openMonitor && (
            <div className="ml-6 mt-1 space-y-1">
              {monitorItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={`w-full justify-start px-3 py-2 h-auto text-sm ${
                      isActive(item.path)
                        ? "bg-[var(--arena-orange)] hover:bg-[var(--arena-orange-hover)] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => navigate(item.path)}
                    data-testid={`nav-${item.path.replace("/", "")}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer Link */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 h-auto font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => navigate("/dataspace-settings")}
          data-testid="nav-dataspace-settings"
        >
          <Settings className="h-5 w-5 mr-3" />
          {t("dataspaceSettings")}
        </Button>
      </div>
    </div>
  );
}