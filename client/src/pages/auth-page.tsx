import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  loginUserSchema, 
  registerUserSchema, 
  LoginUserValues, 
  RegisterUserValues 
} from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Redirecionar para a página principal se o usuário já estiver logado
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginUserValues>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterUserValues>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      name: "",
    },
  });

  const onLoginSubmit = (values: LoginUserValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterUserValues) => {
    console.log("Formulário de registro submetido com valores:", values);
    try {
      registerMutation.mutate(values);
    } catch (error) {
      console.error("Erro ao chamar a mutação de registro:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null; // O useEffect vai redirecionar
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50">
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Bem-vindo ao EventoPro
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? "Entre para gerenciar seus eventos" 
                : "Crie uma conta para começar a gerenciar eventos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Cadastro</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form 
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite seu nome de usuário" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Digite sua senha" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Entrar
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form 
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)} 
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="Escolha um nome de usuário" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Digite seu email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Crie uma senha forte" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Criar conta
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={() => window.location.href = "/auth/google"}
              >
                <i className="ri-google-fill mr-2 text-red-500"></i>
                Google
              </Button>
              {/* Facebook button pode ser ativado posteriormente */}
              {/* <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={() => window.location.href = "/auth/facebook"}
              >
                <i className="ri-facebook-fill mr-2 text-blue-600"></i>
                Facebook
              </Button> */}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 items-center justify-center flex-col text-white">
        <div className="max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">EventoPro</h1>
            <div className="h-1 w-24 bg-white/30 mx-auto rounded-full"></div>
          </div>
          
          <p className="text-xl leading-relaxed">
            A plataforma completa para gerenciar seus eventos de forma fácil e profissional.
          </p>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <i className="ri-calendar-event-fill mr-3 text-xl"></i>
                Gestão de Eventos
              </h3>
              <ul className="space-y-2 text-white/90">
                <li className="flex items-start">
                  <i className="ri-check-line mr-2 mt-1 text-primary-200"></i>
                  <span>Crie eventos com imagens, descrições e informações detalhadas</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line mr-2 mt-1 text-primary-200"></i>
                  <span>Programe datas e horários com visibilidade em calendário</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <i className="ri-group-fill mr-3 text-xl"></i>
                Gerenciamento de Participantes
              </h3>
              <ul className="space-y-2 text-white/90">
                <li className="flex items-start">
                  <i className="ri-check-line mr-2 mt-1 text-primary-200"></i>
                  <span>Controle de presença e confirmações</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line mr-2 mt-1 text-primary-200"></i>
                  <span>Gestão de contatos e comunicações</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <i className="ri-pie-chart-fill mr-3 text-xl"></i>
                Análise e Relatórios
              </h3>
              <ul className="space-y-2 text-white/90">
                <li className="flex items-start">
                  <i className="ri-check-line mr-2 mt-1 text-primary-200"></i>
                  <span>Dashboard com estatísticas e métricas</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line mr-2 mt-1 text-primary-200"></i>
                  <span>Acompanhamento de todas as atividades em tempo real</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}