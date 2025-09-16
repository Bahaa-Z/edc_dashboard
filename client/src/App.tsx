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
  // DEMO MODE: Skip authentication for demo purposes
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
  // DEMO MODE: Skip Keycloak initialization for demo purposes
  console.log('[APP] Running in DEMO MODE - skipping Keycloak authentication');

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