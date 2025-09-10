import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { LogIn } from "lucide-react";

export default function Login() {
  const { t } = useApp();

  const handleKeycloakLogin = () => {
    // Redirect to Authorization Code Flow
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="fixed inset-0">
      {/* Background */}
      <img
        src="/background.svg"
        alt="Background"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg shadow-2xl bg-white/95 backdrop-blur-sm border-0">
          <CardContent className="p-8">
            {/* Logo + Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img
                  src="/ARENA2036_logomark_orange.svg"
                  alt="ARENA2036 Logo"
                  className="w-20 h-20"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="login-title">
                {t("arena2036")}
              </h1>
              <p className="text-gray-600 mt-2" data-testid="login-subtitle">
                {t("edcManagementConsole")}
              </p>
            </div>

            {/* Authorization Code Flow Login */}
            <div className="space-y-6">
              {/* Info Text */}
              <div className="text-center space-y-3">
                <p className="text-gray-600 text-sm">
                  Authenticate using your ARENA2036 Keycloak account
                </p>
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
                  <p>✅ Secure Authorization Code Flow</p>
                  <p>✅ Real Keycloak authentication</p>
                  <p>✅ User activity appears in Keycloak logs</p>
                </div>
              </div>

              {/* Keycloak Login Button */}
              <Button
                onClick={handleKeycloakLogin}
                className="w-full bg-[#F28C00] hover:bg-[#d67b00] text-white text-lg py-6 font-semibold"
                data-testid="keycloak-login"
              >
                <LogIn className="w-5 h-5 mr-3" />
                Login with Keycloak
              </Button>

              {/* Additional Info */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  You will be redirected to Keycloak for secure authentication
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}