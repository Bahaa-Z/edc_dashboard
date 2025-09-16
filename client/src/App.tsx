// client/src/App.tsx
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import DataspaceSettings from "@/pages/DataspaceSettings";
import Sde from "@/pages/Sde";
import Monitor from "@/pages/Monitor";
import ProcessLogs from "@/pages/ProcessLogs";
import EdcTransactions from "@/pages/EdcTransactions";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import { initKeycloak, isAuthenticated, login } from "@/auth/keycloak";
import { AppProvider } from "@/context/AppContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    console.log('[PROTECTED_ROUTE] User not authenticated, redirecting to Keycloak');
    login(); // Redirect to Keycloak login page
    return <div className="flex items-center justify-center h-screen">
      <div className="text-lg">Redirecting to login...</div>
    </div>;
  }
  return <>{children}</>;
}
function Router() {
  return (
    <Switch>
      {/* Alle Routen sind Protected - kein /login Route (Keycloak übernimmt) */}
      <Route path="/">
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      </Route>

      <Route path="/dataspace-settings">
        <ProtectedRoute><AppLayout><DataspaceSettings /></AppLayout></ProtectedRoute>
      </Route>

      <Route path="/sde">
        <ProtectedRoute><AppLayout><Sde /></AppLayout></ProtectedRoute>
      </Route>

      <Route path="/monitor">
        <ProtectedRoute><AppLayout><Monitor /></AppLayout></ProtectedRoute>
      </Route>

      <Route path="/process-logs">
        <ProtectedRoute><AppLayout><ProcessLogs /></AppLayout></ProtectedRoute>
      </Route>

      <Route path="/edc-transactions">
        <ProtectedRoute><AppLayout><EdcTransactions /></AppLayout></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [keycloakInitialized, setKeycloakInitialized] = useState(false);

  useEffect(() => {
    // Keycloak OIDC Initialization
    console.log('[APP] Starting Keycloak OIDC initialization...');
    initKeycloak()
      .then((authenticated) => {
        console.log('[APP] Keycloak initialized. User authenticated:', authenticated);
        setKeycloakInitialized(true);
      })
      .catch((error) => {
        console.error('[APP] Keycloak initialization failed:', error);
        setKeycloakInitialized(true); // Continue even if failed
      });
  }, []);

  // Show loading spinner while Keycloak initializes
  if (!keycloakInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <div className="ml-4 text-lg">Initializing authentication...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}