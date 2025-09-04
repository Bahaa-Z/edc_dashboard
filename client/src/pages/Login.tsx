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
    mutationFn: async (values: LoginCredentials) => {
      // Authorization Code Flow - get auth URL and redirect
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: values.username }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start authentication");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Redirect to Keycloak for authentication
      console.log("[LOGIN] Redirecting to Keycloak for authentication");
      window.location.href = data.authUrl;
    },
    onError: async (err: any) => {
      toast({
        title: "Error",
        description:
          (typeof err?.message === "string" && err.message) || "Failed to start authentication",
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

            {/* Login Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  {t("username")}
                </Label>
                <Input
                  {...form.register("username")}
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  className="w-full"
                  data-testid="login-username"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-600" data-testid="login-username-error">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              {/* Info Text */}
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  Enter your username and click "Continue to Keycloak" to authenticate with your Keycloak credentials.
                </p>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <input
                  {...form.register("rememberMe")}
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#F28C00] focus:ring-[#F28C00]"
                  data-testid="login-remember-me"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Remember me
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-[#F28C00] hover:bg-[#d67b00] text-white"
                data-testid="login-submit"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Logging in...
                  </div>
                ) : (
                  "Continue to Keycloak"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}