// client/src/auth/ProtectedRoute.tsx
import { Redirect } from "wouter";
import { useApp } from "@/context/AppContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <>{children}</>;
}