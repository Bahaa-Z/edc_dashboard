import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";

export default function Monitor() {
  const { t } = useApp();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="monitor-title">
          {t("monitor")}
        </h1>
      </div>
      
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-600" data-testid="monitor-placeholder">
              {t("placeholderPage")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
