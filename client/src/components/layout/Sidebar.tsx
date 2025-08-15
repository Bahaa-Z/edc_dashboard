import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Database, 
  Monitor, 
  FileText, 
  ArrowRightLeft, 
  Settings 
} from "lucide-react";

export function Sidebar() {
  const { t } = useApp();
  const [location, navigate] = useLocation();

  const navItems = [
    { path: "/", label: t("dashboard"), icon: LayoutDashboard },
    { path: "/sde", label: t("sde"), icon: Database },
    { path: "/monitor", label: t("monitor"), icon: Monitor },
    { path: "/process-logs", label: t("processLogs"), icon: FileText },
    { path: "/edc-transactions", label: t("edcTransactions"), icon: ArrowRightLeft },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <div className="w-64 bg-white shadow-lg flex-shrink-0 border-r border-gray-200 h-full">
      <div className="p-6">
        <h1 className="text-lg font-bold text-gray-800 mb-8" data-testid="sidebar-title">
          {t("edcManagementConsole")}
        </h1>
        
        <nav className="space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                className={`w-full justify-start px-4 py-3 h-auto font-medium transition-colors ${
                  isActive(item.path) 
                    ? "bg-[var(--arena-orange)] hover:bg-[var(--arena-orange-hover)] text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => navigate(item.path)}
                data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
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
    </div>
  );
}
