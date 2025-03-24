import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import Calendar from "@/pages/calendar";
import EventDetails from "@/pages/event-details";
import EditEventPage from "@/pages/edit-event-page";
import Attendees from "@/pages/attendees";
import Reports from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import AuthPage from "@/pages/auth-page";

function Router() {
  return (
    <Switch>
      {/* Rota protegida somente para admins */}
      <ProtectedRoute path="/" adminOnly>
        <Dashboard />
      </ProtectedRoute>

      {/* Rotas protegidas para usuários autenticados */}
      <ProtectedRoute path="/events">
        <Events />
      </ProtectedRoute>
      
      <ProtectedRoute path="/events/:id">
        <EventDetails />
      </ProtectedRoute>
      
      <ProtectedRoute path="/events/:id/edit">
        <EditEventPage />
      </ProtectedRoute>
      
      <ProtectedRoute path="/calendar">
        <Calendar />
      </ProtectedRoute>
      
      <ProtectedRoute path="/attendees">
        <Attendees />
      </ProtectedRoute>
      
      <ProtectedRoute path="/reports" adminOnly>
        <Reports />
      </ProtectedRoute>
      
      <ProtectedRoute path="/settings">
        <SettingsPage />
      </ProtectedRoute>

      {/* Rota pública para autenticação */}
      <Route path="/auth" component={AuthPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
