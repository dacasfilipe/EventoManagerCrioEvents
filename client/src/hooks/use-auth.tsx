import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User, InsertUser, LoginUserValues, RegisterUserValues } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ProfileUpdateData = {
  name?: string;
  email?: string;
  avatarUrl?: string;
};

type PasswordChangeData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type NotificationPreferences = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginUserValues>;
  logoutMutation: UseMutationResult<Response, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterUserValues>;
  updateProfileMutation: UseMutationResult<User, Error, ProfileUpdateData>;
  changePasswordMutation: UseMutationResult<{message: string}, Error, PasswordChangeData>;
  updateNotificationsMutation: UseMutationResult<{message: string, preferences: NotificationPreferences}, Error, NotificationPreferences>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUserValues) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterUserValues) => {
      try {
        console.log("Enviando dados de registro:", userData);
        const res = await apiRequest("POST", "/api/register", userData);
        const data = await res.json();
        console.log("Resposta do registro:", data);
        return data;
      } catch (error) {
        console.error("Erro durante o registro:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      console.log("Usuário registrado com sucesso:", user);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registro bem-sucedido",
        description: `Bem-vindo, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Erro de registro tratado no onError:", error);
      toast({
        title: "Falha no registro",
        description: error.message || "Não foi possível criar a conta",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Iniciando logout...");
      try {
        const response = await apiRequest("POST", "/api/logout");
        console.log("Resposta do logout:", response.status);
        return response;
      } catch (error) {
        console.error("Erro durante logout:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Logout bem-sucedido, limpando dados do usuário...");
      queryClient.setQueryData(["/api/user"], null);
      // Limpar outras caches relacionadas ao usuário
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // A navegação será feita pelo componente que chama esta mutação
      
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso",
      });
    },
    onError: (error: Error) => {
      console.error("Erro no logout:", error);
      toast({
        title: "Falha no logout",
        description: error.message || "Não foi possível fazer logout",
        variant: "destructive",
      });
      
      // Forçar limpeza em caso de erro
      queryClient.setQueryData(["/api/user"], null);
      
      // A navegação será feita pelo componente que chama esta mutação
    },
  });

  // Mutação para atualizar o perfil do usuário
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileUpdateData) => {
      if (!user) throw new Error("Usuário não autenticado");
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, profileData);
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha na atualização",
        description: error.message || "Não foi possível atualizar o perfil",
        variant: "destructive",
      });
    },
  });

  // Mutação para alterar a senha
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: PasswordChangeData) => {
      if (!user) throw new Error("Usuário não autenticado");
      const res = await apiRequest("POST", `/api/users/${user.id}/change-password`, passwordData);
      return await res.json();
    },
    onSuccess: (data: {message: string}) => {
      toast({
        title: "Senha alterada",
        description: data.message || "Sua senha foi alterada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha na alteração de senha",
        description: error.message || "Não foi possível alterar sua senha",
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar preferências de notificação
  const updateNotificationsMutation = useMutation({
    mutationFn: async (notificationData: NotificationPreferences) => {
      if (!user) throw new Error("Usuário não autenticado");
      const res = await apiRequest("PATCH", `/api/users/${user.id}/notifications`, notificationData);
      return await res.json();
    },
    onSuccess: (data: {message: string, preferences: NotificationPreferences}) => {
      toast({
        title: "Preferências atualizadas",
        description: data.message || "Suas preferências de notificação foram atualizadas",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha na atualização",
        description: error.message || "Não foi possível atualizar suas preferências",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
        changePasswordMutation,
        updateNotificationsMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}