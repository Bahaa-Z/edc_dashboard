import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Login() {
  const { t, user } = useApp();
  const [, navigate] = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Simple Keycloak login - redirect to backend
  const handleKeycloakLogin = () => {
    console.log("[LOGIN] Redirecting to Keycloak...");
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

            {/* Login Info */}
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm">
                Sign in with your Keycloak account
              </p>
            </div>

            {/* Simple Keycloak Login Button */}
            <div className="space-y-4">
              <Button
                onClick={handleKeycloakLogin}
                className="w-full bg-[#F28C00] hover:bg-[#d67b00] text-white py-3 text-lg"
                data-testid="keycloak-login"
              >
                <div className="flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 mr-2" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M12 2L2 7L12 12L22 7L12 2Z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                    <path 
                      d="M2 17L12 22L22 17" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                    <path 
                      d="M2 12L12 17L22 12" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  Login with Keycloak
                </div>
              </Button>
            </div>

            {/* Security Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Client ID: CX-EDC • Secure SSO Authentication
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}