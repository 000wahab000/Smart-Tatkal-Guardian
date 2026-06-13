import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Synchronously parse query parameter on module evaluation to guarantee localStorage availability before any React mounting
if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  const emailParam = params.get("email");
  if (emailParam) {
    localStorage.setItem("tatkal_user", emailParam);
    // Strip the query parameters cleanly from the address bar to keep it neat
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

/** Listens for cross-origin postMessage from landing.html (port 8001).
 *  When tatkal_auth arrives, writes the email to localStorage and
 *  navigates straight to /dashboard — no second login needed. */
function AuthBridge() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Accept messages only from the landing-page origin
      if (event.origin !== "http://localhost:8001") return;
      if (event.data?.type === "tatkal_auth" && event.data?.email) {
        localStorage.setItem("tatkal_user", event.data.email);
        setLocation("/dashboard");
      }
      if (event.data?.type === "tatkal_logout") {
        localStorage.removeItem("tatkal_user");
        setLocation("/");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setLocation]);

  return null;
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthBridge />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
