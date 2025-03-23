import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";
import React, { ReactNode } from "react";

interface ProtectedRouteProps extends RouteProps {
  adminOnly?: boolean;
  children?: ReactNode;
  component?: any;
}

export function ProtectedRoute({
  component,
  adminOnly = false,
  children,
  ...rest
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route {...rest}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route {...rest}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (adminOnly && user.role !== "admin") {
    return (
      <Route {...rest}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso restrito</h1>
          <p className="text-muted-foreground mb-6">
            Esta página requer privilégios de administrador.
          </p>
          <Redirect to="/events" />
        </div>
      </Route>
    );
  }

  return (
    <Route {...rest}>
      {component ? React.createElement(component) : children}
    </Route>
  );
}