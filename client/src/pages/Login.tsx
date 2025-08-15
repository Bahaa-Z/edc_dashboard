import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { t, setUser } = useApp();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      setUser(data.user);
      navigate("/");
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-40" />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="mb-4">
                <div className="w-16 h-16 bg-[var(--arena-orange)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="login-title">
                  {t("arena2036")}
                </h1>
                <p className="text-gray-600 mt-2" data-testid="login-subtitle">
                  {t("edcManagementConsole")}
                </p>
              </div>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="username">{t("username")}</Label>
                <Input
                  id="username"
                  type="text"
                  {...form.register("username")}
                  className="mt-1"
                  data-testid="username-input"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  className="mt-1"
                  data-testid="password-input"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-[var(--arena-orange)] hover:bg-[var(--arena-orange-hover)] text-white"
                data-testid="sign-in-button"
              >
                {loginMutation.isPending ? "Signing in..." : t("signIn")}
              </Button>
            </form>
            
            <div className="mt-4 text-sm text-gray-600 text-center">
              <p>Use username: <strong>admin</strong> and password: <strong>admin123</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
