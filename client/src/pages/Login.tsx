import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";

import { loginSchema, type LoginCredentials } from "@shared/schema";
import { Eye, EyeOff } from "lucide-react";

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
    // HINWEIS: api.login ruft /api/auth/login auf (JSON), KEINE HTML-Seite!
    mutationFn: api.login,
    onSuccess: (data, values) => {
      // Session-Cookie kommt vom Server (HttpOnly).
      // Wir merken uns den User im AppContext (optional: rememberMe -> localStorage)
      loginUser(
        { id: data.user.id, username: data.user.username },
        "", // kein clientseitiges Token nötig (Server-Session)
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

            {/* Login-Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Username */}
              <div>
                <Label htmlFor="username">{t("username")}</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  {...form.register("username")}
                  className="mt-1 bg-white"
                  data-testid="username-input"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              {/* Password + Toggle */}
              <div>
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...form.register("password")}
                    className="bg-white pr-10"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <label className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    {...form.register("rememberMe")}
                    className="h-4 w-4 text-[var(--arena-orange)]"
                    data-testid="remember-me-checkbox"
                  />
                  Remember me
                </label>
                <span className="text-gray-400 select-none">&nbsp;</span>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-[var(--arena-orange,#F28C00)] hover:bg-[#d67b00] text-white"
                data-testid="sign-in-button"
              >
                {loginMutation.isPending ? "Signing in..." : t("signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}