import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Server, 
  Database, 
  Shield, 
  FileText, 
  HandshakeIcon, 
  Package,
  TrendingUp,
  ArrowUp,
  ArrowDown
} from "lucide-react";

const getIconForKpi = (key: string) => {
  const icons = {
    numberOfConnectors: Server,
    assets: Database,
    policies: Shield,
    contracts: FileText,
  };
  return icons[key as keyof typeof icons] || Server;
};

const getColorForKpi = (key: string) => {
  const colors = {
    numberOfConnectors: "text-blue-600 bg-blue-100",
    assets: "text-green-600 bg-green-100", 
    policies: "text-purple-600 bg-purple-100",
    contracts: "text-orange-600 bg-orange-100",
  };
  return colors[key as keyof typeof colors] || "text-blue-600 bg-blue-100";
};

export function KpiCards() {
  const { t } = useApp();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["/api/sde/stats"],
    queryFn: api.getSdeStats,
  });

  const kpiItems = [
    { key: "numberOfConnectors", value: stats?.connectors },
    { key: "assets", value: stats?.assets },
    { key: "policies", value: stats?.policies },
    { key: "contracts", value: stats?.contracts },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-white/80 backdrop-blur border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center text-red-800">
          <TrendingUp className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">
            Failed to load KPIs from SDE
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpiItems.map((item) => {
        const Icon = getIconForKpi(item.key);
        const colorClass = getColorForKpi(item.key);
        
        return (
          <Card key={item.key} className="bg-white/80 backdrop-blur border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1" data-testid={`kpi-${item.key}-label`}>
                      {t(item.key as any)}
                    </h3>
                    <p className="text-3xl font-bold text-gray-900" data-testid={`kpi-${item.key}-value`}>
                      {item.value ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}