import { useApp } from "@/context/AppContext";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { ConnectorsTable } from "@/components/dashboard/ConnectorsTable";

export default function Dashboard() {
  const { t } = useApp();

  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="dashboard-title">
          {t("dashboard")}
        </h1>
      </div>

      {/* Overview Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4" data-testid="overview-title">
          {t("overview")}
        </h2>
        <KpiCards />
      </div>

      {/* Connectors Table Section */}
      <ConnectorsTable />
    </div>
  );
}
