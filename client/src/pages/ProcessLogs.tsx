import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";

export default function ProcessLogs() {
  const { t } = useApp();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="process-logs-title">
          {t("processLogs")}
        </h1>
      </div>
      
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-600" data-testid="process-logs-placeholder">
              {t("placeholderPage")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
