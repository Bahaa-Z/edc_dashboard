import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";

export default function Login() {
  const { t } = useApp();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Handle OAuth errors from URL parameters
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    
    if (error) {
      const errorMessages: Record<string, string> = {
        oauth_error: "Authentication failed. Please try again.",
        missing_params: "Invalid response from authentication server.",
        invalid_state: "Security check failed. Please try again.",
        token_exchange_failed: "Authentication service error.",
        no_access_token: "Authentication incomplete.",
        server_error: "Server error occurred during authentication."
      };
      
      toast({
        title: "Authentication Error",
        description: errorMessages[error] || "Login failed. Please try again.",
        variant: "destructive",
      });
      
      // Clear error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const handleKeycloakLogin = () => {
    setIsLoading(true);
    // Redirect to OAuth2 authorization endpoint
    window.location.href = '/api/auth/authorize';
  };

  return (
    <div className="fixed inset-0">
      {/* Hintergrundbild */}
      <img
        src="/background.svg"
        alt="Background"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      {/* Inhalt */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg shadow-2xl bg-white/95 backdrop-blur-sm border-0">
          <CardContent className="p-8">
            {/* Logo + Titel */}
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

            {/* OAuth2 Login */}
            <div className="space-y-4">
              <p className="text-center text-gray-600 text-sm mb-6">
                Sign in with your ARENA2036 Keycloak account
              </p>
              
              <Button
                onClick={handleKeycloakLogin}
                disabled={isLoading}
                className="w-full bg-[#F28C00] hover:bg-[#D17A00] text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
                data-testid="keycloak-login-button"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Redirecting to Keycloak...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C13.1 2 14 2.9 14 4V8H18C19.1 8 20 8.9 20 10V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V10C4 8.9 4.9 8 6 8H10V4C10 2.9 10.9 2 12 2M12 4V8H12V4Z" />
                    </svg>
                    <span>Sign in with Keycloak</span>
                  </>
                )}
              </Button>
              
              <div className="text-center text-xs text-gray-500 mt-4">
                You will be redirected to the ARENA2036 identity provider
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}