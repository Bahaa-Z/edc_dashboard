import { useApp } from "@/context/AppContext";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { ConnectorsTable } from "@/components/dashboard/ConnectorsTable";
import { TrendingUp, Activity, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { t } = useApp();

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Welcome Header with Gradient */}
      <div className="bg-gradient-to-r from-[var(--arena-orange)] to-orange-500 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="dashboard-title">
              {t("dashboard")}
            </h1>
            <p className="text-orange-100 text-lg">
              Welcome to your EDC Management Console
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Activity className="h-12 w-12 text-orange-100" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/80 backdrop-blur border-0 shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Excellent</div>
            <p className="text-xs text-gray-500 mt-1">All systems operational</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur border-0 shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-blue-600" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Secured</div>
            <p className="text-xs text-gray-500 mt-1">All connections encrypted</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur border-0 shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-[var(--arena-orange)]" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--arena-orange)]">Active</div>
            <p className="text-xs text-gray-500 mt-1">Data flows running</p>
          </CardContent>
        </Card>
      </div>

      {/* Overview Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center" data-testid="overview-title">
            <TrendingUp className="h-6 w-6 mr-3 text-[var(--arena-orange)]" />
            {t("overview")}
          </h2>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        <KpiCards />
      </div>

      {/* Connectors Table Section */}
      <div className="space-y-4">
        <ConnectorsTable />
      </div>
    </div>
  );
}
