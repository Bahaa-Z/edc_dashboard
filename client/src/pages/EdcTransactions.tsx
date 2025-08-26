import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";

export default function EdcTransactions() {
  const { t } = useApp();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="edc-transactions-title">
          {t("edcTransactions")}
        </h1>
      </div>
      
      {/* Placeholder Content */}
      <Card className="bg-card shadow-card">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-arena-gray-900">
                Transaction History & Management
              </h3>
              <p className="text-arena-gray-500">
                Monitor and manage all EDC transactions, contract negotiations, 
                data transfers, and agreement status across your dataspace network.
              </p>
              <div className="text-sm text-arena-gray-400">
                Coming soon...
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
