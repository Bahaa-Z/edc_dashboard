import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { ExternalLink } from "lucide-react";

export default function Sde() {
  const { t } = useApp();

  const handleOpenSde = () => {
    const sdeUrl = import.meta.env.VITE_SDE_URL || "http://localhost:3001";
    window.open(sdeUrl, "_blank");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="sde-title">
          {t("sde")}
        </h1>
      </div>
      
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-6" data-testid="sde-description">
              {t("whatUserCanDo")}
            </p>
            
            <Button
              onClick={handleOpenSde}
              className="bg-[var(--arena-orange)] hover:bg-[var(--arena-orange-hover)] text-white"
              data-testid="open-sde-button"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("openSdeInNewTab")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
