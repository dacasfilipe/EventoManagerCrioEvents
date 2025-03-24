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
      confirmPassword: "",
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
                      render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Digite seu nome completo" 
                              value={value || ""} 
                              onChange={onChange}
                              {...fieldProps}
                            />
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
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirme a senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Digite a senha novamente" {...field} />
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
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden p-12 items-center justify-center flex-col text-white">
        {/* Background Design Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-20 -mr-20 backdrop-blur-sm"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -mb-40 -ml-40 backdrop-blur-sm"></div>
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-white/10 rounded-full transform rotate-45"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-white/10 rounded-full"></div>
        
        {/* Content */}
        <div className="max-w-md space-y-8 relative z-10">
          {/* Logo Area */}
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md shadow-lg shadow-primary-900/20 flex items-center justify-center">
              {/* Espaço para logomarca */}
              <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2V5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 2V5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 9H21" stroke="white" strokeWidth="2"/>
                <path d="M19 4H5C3.89543 4 3 4.89543 3 6V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V6C21 4.89543 20.1046 4 19 4Z" stroke="white" strokeWidth="2"/>
                <path d="M12 8V16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 12H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">EventoPro</h1>
            <div className="h-1 w-32 bg-gradient-to-r from-white/80 to-white/20 mx-auto rounded-full mb-4"></div>
            <p className="text-xl leading-relaxed mb-8 text-white/90 backdrop-blur-sm py-2 px-4 bg-indigo-700/40 rounded-lg shadow-inner">
              A plataforma completa para gerenciar seus eventos de forma fácil e profissional.
            </p>
          </div>
          
          <h2 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 text-center">Principais Funcionalidades</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-800/10 rounded-lg p-6 backdrop-blur-sm shadow-lg border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl">
              <div className="w-10 h-10 bg-blue-500/30 rounded-full mb-4 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-3 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Gestão de Eventos
              </h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 mr-3 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Crie eventos com imagens e informações detalhadas</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 mr-3 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Visualize programação em calendário interativo</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-800/10 rounded-lg p-6 backdrop-blur-sm shadow-lg border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl">
              <div className="w-10 h-10 bg-blue-500/30 rounded-full mb-4 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-3 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Gerenciamento de Participantes
              </h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 mr-3 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Controle de presença e confirmações</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 mr-3 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Gestão de contatos e comunicações</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-800/10 rounded-lg p-6 backdrop-blur-sm shadow-lg border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl">
              <div className="w-10 h-10 bg-blue-500/30 rounded-full mb-4 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-3 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Análise e Relatórios
              </h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 mr-3 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Dashboard com estatísticas e métricas</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 mr-3 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Acompanhamento de atividades em tempo real</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-800/10 rounded-lg p-6 backdrop-blur-sm shadow-lg border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl">
              <div className="w-10 h-10 bg-blue-500/30 rounded-full mb-4 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-3 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Segurança e Acesso
              </h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 mr-3 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Autenticação segura (Google, usuário/senha)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 mr-3 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Sistema de permissões para admin e usuários</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}