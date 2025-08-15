import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import { queryClient } from "./lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DataspaceSettings from "@/pages/DataspaceSettings";
import Sde from "@/pages/Sde";
import Monitor from "@/pages/Monitor";
import ProcessLogs from "@/pages/ProcessLogs";
import EdcTransactions from "@/pages/EdcTransactions";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  
  if (isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dataspace-settings">
        <ProtectedRoute>
          <DataspaceSettings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/sde">
        <ProtectedRoute>
          <Sde />
        </ProtectedRoute>
      </Route>
      
      <Route path="/monitor">
        <ProtectedRoute>
          <Monitor />
        </ProtectedRoute>
      </Route>
      
      <Route path="/process-logs">
        <ProtectedRoute>
          <ProcessLogs />
        </ProtectedRoute>
      </Route>
      
      <Route path="/edc-transactions">
        <ProtectedRoute>
          <EdcTransactions />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Router />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
