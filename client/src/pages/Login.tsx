import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { loginSchema, type LoginCredentials } from "@shared/schema";

export default function Login() {
  const { t, loginUser } = useApp();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", rememberMe: false },
    mode: "onSubmit",
  });

  const loginMutation = useMutation({
    mutationFn: api.getToken,
    onSuccess: (data, values) => {
      // Store JWT token and user info (SDE style) - using existing context
      loginUser(
        { id: data.user.id, username: data.user.username, email: data.user.email },
        data.access_token, // JWT Token 
        values.rememberMe ?? false
      );
      toast({ title: "Success", description: "Logged in successfully." });
      navigate("/");
    },
    onError: async (err: any) => {
      toast({
        title: "Error",
        description:
          (typeof err?.message === "string" && err.message) || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: LoginCredentials) => {
    loginMutation.mutate(values);
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

            {/* SDE-Style Keycloak Authentication */}
            <div className="space-y-4">
              <Button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3"
                onClick={() => window.location.href = '/api/auth/authorize'}
              >
                🔐 Sign in with Keycloak
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                <p>Same authentication as SDE application</p>
                <p className="mt-1">Uses Authorization Code Flow with your organization credentials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}