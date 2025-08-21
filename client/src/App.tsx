import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/useAuth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import RealTimeMonitor from "@/pages/RealTimeMonitor";
import AgentObservability from "@/pages/AgentObservability";
import ReportsAnalytics from "@/pages/ReportsAnalytics";
import Administration from "@/pages/Administration";
import EmailConfiguration from "@/pages/EmailConfiguration";
import ERPIntegration from "@/pages/ERPIntegration";
import AISettings from "@/pages/AISettings";
import POResults from "@/pages/POResults";
import Layout from "@/components/Layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/realtime" component={RealTimeMonitor} />
          <Route path="/agent" component={AgentObservability} />
          <Route path="/reports" component={ReportsAnalytics} />
          <Route path="/admin" component={Administration} />
          <Route path="/email-config" component={EmailConfiguration} />
          <Route path="/erp-config" component={ERPIntegration} />
          <Route path="/ai-settings" component={AISettings} />
          <Route path="/results" component={POResults} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
