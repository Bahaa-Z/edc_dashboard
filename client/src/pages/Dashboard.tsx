import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { ConnectorsTable } from "@/components/dashboard/ConnectorsTable";
import { TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EdcDetailDrawer, { EdcDetails } from "@/components/EdcDetailDrawer";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Dashboard() {
  const { t } = useApp();
  const [selectedEdc, setSelectedEdc] = useState<EdcDetails | null>(null);

  const { data: connectors = [] } = useQuery({
    queryKey: ["/api/connectors"],
    queryFn: api.getConnectors,
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1" data-testid="dashboard-title">
              {t("dashboard")}
            </h1>
            <p className="text-gray-600 text-base">
              {t("welcomeMessage")}
            </p>
          </div>
          <div className="hidden md:flex items-center">
            <Activity className="h-10 w-10 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Trennlinie */}
      <div className="px-6">
        <hr className="border-gray-200" />
      </div>

      {/* Quick Stats */}
      <div className="px-6 pt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Dataspace Card */}
        <Card className="border border-orange-300 shadow-sm hover:shadow-md transition-shadow bg-orange-50">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-orange-800">
              🌐 Data Space
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-semibold text-orange-900">Catena-X</div>
            <p className="text-xs text-orange-700 mt-1">Connected Environment</p>
          </CardContent>
        </Card>

        {/* Connector Count Card */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-gray-700">
              🔗 Connectors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-semibold text-gray-900">{connectors.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total registered</p>
          </CardContent>
        </Card>

        {/* System Health Card */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              {t("systemHealth")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-semibold text-gray-900">{t("healthy")}</div>
            <p className="text-xs text-gray-500 mt-1">{t("allSystemsOperational")}</p>
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-[var(--arena-orange)]" />
              {t("activity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-semibold text-gray-900">{t("active")}</div>
            <p className="text-xs text-gray-500 mt-1">{t("dataFlowsRunning")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Connectors-Tabelle */}
      <div className="px-6 py-8">
        <ConnectorsTable onSelectEdc={(edc: EdcDetails) => setSelectedEdc(edc)} />
      </div>

      {/* Detailansicht */}
      {selectedEdc && (
        <EdcDetailDrawer edc={selectedEdc} onClose={() => setSelectedEdc(null)} />
      )}
    </div>
  );
}