import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { ConnectorsTable } from "@/components/dashboard/ConnectorsTable";
import { TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EdcDetailDrawer, { EdcDetails } from "@/components/EdcDetailDrawer";

export default function Dashboard() {
  const { t } = useApp();
  const [selectedEdc, setSelectedEdc] = useState<EdcDetails | null>(null);
  const [connectorCount, setConnectorCount] = useState(0);

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
      <div className="px-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Health */}
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

        {/* Number of Connectors */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
              {t("numberOfConnectors")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-semibold text-gray-900">{connectorCount}</div>
            <p className="text-xs text-gray-500 mt-1">{t("connectorsRegistered")}</p>
          </CardContent>
        </Card>

        {/* Data Space Info */}
        <Card className="border border-orange-300 bg-orange-50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
              {t("dataSpace")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-semibold text-orange-900">Catena-X</div>
            <p className="text-xs text-orange-800 mt-1">{t("dataSpaceLabel")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Connectors-Tabelle */}
      <div className="px-6 py-8">
        <ConnectorsTable
          onSelectEdc={(edc: EdcDetails) => setSelectedEdc(edc)}
          onCountChange={(count: number) => setConnectorCount(count)}
        />
      </div>

      {/* Detailansicht: Jetzt mittig statt seitlich */}
      {selectedEdc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <EdcDetailDrawer edc={selectedEdc} onClose={() => setSelectedEdc(null)} />
        </div>
      )}
    </div>
  );
}