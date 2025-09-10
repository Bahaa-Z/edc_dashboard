import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";

export default function Login() {
  const { t, checkAuth } = useApp();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [location] = useLocation();

  // Check for login success/error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'success') {
      toast({ title: "Success", description: "Logged in successfully" });
      checkAuth();
      navigate("/");
    } else if (urlParams.get('login') === 'error') {
      toast({ title: "Error", description: "Authentication failed", variant: "destructive" });
    }
  }, [location, toast, checkAuth, navigate]);

  // Demo Login Mutation
  const demoLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isDemo: true }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Demo login failed");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast({ 
        title: "Demo Mode", 
        description: "Demo login successful" 
      });
      await checkAuth(); // Update user state
      navigate("/");
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Demo login failed",
        variant: "destructive",
      });
    },
  });

  // Keycloak Authorization Code Login Mutation
  const keycloakLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.redirect && data.authUrl) {
        // Redirect to Keycloak
        console.log("[LOGIN] Redirecting to Keycloak Authorization...");
        window.location.href = data.authUrl;
      }
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const handleDemoLogin = () => {
    demoLoginMutation.mutate();
  };

  const handleKeycloakLogin = () => {
    keycloakLoginMutation.mutate();
  };

  return (
    <div className="fixed inset-0 flex flex-col">
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
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
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
              <p className="text-sm text-gray-500 mt-2">
                Client ID: CX-EDC • Authorization Code Grant
              </p>
            </div>

            {/* Login Info */}
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm">
                Scopes: openid catena profile email
              </p>
            </div>

            {/* Login Buttons */}
            <div className="space-y-4">
              {/* Keycloak Login Button */}
              <Button
                onClick={handleKeycloakLogin}
                disabled={keycloakLoginMutation.isPending}
                className="w-full bg-[#F28C00] hover:bg-[#d67b00] text-white py-3"
                data-testid="keycloak-login"
              >
                {keycloakLoginMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Redirecting to Keycloak...
                  </div>
                ) : (
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
                    Login with Keycloak SSO
                  </div>
                )}
              </Button>

              {/* Demo Login Button */}
              <Button
                onClick={handleDemoLogin}
                disabled={demoLoginMutation.isPending}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
                data-testid="demo-login"
              >
                {demoLoginMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Demo Login...
                  </div>
                ) : (
                  "Demo Login (Testing)"
                )}
              </Button>
            </div>

            {/* Technical Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Grant Type: authorization_code • Client Auth: client-secret
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Copyright Footer */}
      <div className="relative z-10 text-center py-4">
        <p className="text-white text-sm">
          Copyright © Catena-X Automotive Network
        </p>
      </div>
    </div>
  );
}