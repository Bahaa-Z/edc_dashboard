import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export function KpiCards() {
  const { t } = useApp();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["/api/sde/stats"],
    queryFn: api.getSdeStats, // 👈 lädt SDE + fallback
  });

  const kpiItems = [
    { key: "numberOfConnectors", value: stats?.connectors },
    { key: "assets", value: stats?.assets },
    { key: "policies", value: stats?.policies },
    { key: "contracts", value: stats?.contracts },
    { key: "contractAgreements", value: stats?.contractAgreements },
    { key: "dataOffers", value: stats?.dataOffers },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Failed to load KPIs from SDE
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpiItems.map((item) => (
        <Card key={item.key} className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-600" data-testid={`kpi-${item.key}-label`}>
                {t(item.key as any)}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2" data-testid={`kpi-${item.key}-value`}>
              {item.value ?? 0}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}