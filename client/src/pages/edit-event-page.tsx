import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Event, EventFormValues, eventFormSchema } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { eventCategories, eventStatuses } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function EditEventPage() {
  const [, params] = useRoute("/events/:id/edit");
  const eventId = params?.id ? parseInt(params.id) : null;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: event, isLoading: isEventLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "17:00",
      location: "",
      category: "conference",
      status: "pending",
      capacity: 50,
      imageUrl: "",
      eventLink: "",
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        name: event.name,
        description: event.description,
        date: new Date(event.date),
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        category: event.category,
        status: event.status,
        capacity: event.capacity || 50,
        imageUrl: event.imageUrl || "",
        eventLink: event.eventLink || "",
      });
      
      if (event.imageUrl) {
        setPreviewUrl(event.imageUrl);
      }
    }
  }, [event, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      return await apiRequest("PATCH", `/api/events/${eventId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Evento atualizado",
        description: "O evento foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      navigate(`/events/${eventId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar evento",
        description: error.message || "Ocorreu um erro ao atualizar o evento",
        variant: "destructive",
      });
    },
  });

  // Função para fazer upload da imagem
  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha ao fazer upload da imagem");
      }

      const result = await response.json();
      return result.imageUrl;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  async function onSubmit(data: EventFormValues) {
    try {
      // Se tiver um arquivo selecionado, faz upload primeiro
      if (selectedFile) {
        const imageUrl = await uploadImage(selectedFile);
        data.imageUrl = imageUrl;
      }

      updateMutation.mutate(data);
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast({
        title: "Erro ao atualizar evento",
        description: "Ocorreu um erro ao fazer upload da imagem ou atualizar o evento",
        variant: "destructive",
      });
    }
  }

  if (!eventId) {
    return <div>ID de evento inválido</div>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Header 
          title="Editar Evento" 
          setIsMobileOpen={setIsMobileOpen} 
          showFilters={false}
        />
        
        <div className="p-4 md:p-6 pb-16">
          <div className="mb-6 flex justify-between items-center">
            <Link href={`/events/${eventId}`}>
              <Button variant="outline" size="sm">
                <i className="ri-arrow-left-line mr-2"></i>
                Voltar para detalhes do evento
              </Button>
            </Link>
          </div>

          {isEventLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : event ? (
            <Card>
              <CardHeader>
                <CardTitle>Editar Evento</CardTitle>
                <CardDescription>
                  Atualize as informações do evento "{event.name}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Evento</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o nome do evento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Descreva o evento"
                                  className="resize-none min-h-32"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Data</FormLabel>
                                <DatePicker
                                  date={field.value}
                                  onChange={(date) => field.onChange(date || new Date())}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <FormField
                              control={form.control}
                              name="startTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Hora de Início</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="endTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Hora de Término</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Local</FormLabel>
                              <FormControl>
                                <Input placeholder="Local do evento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione a categoria" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {eventCategories.map((category) => (
                                      <SelectItem key={category.value} value={category.value}>
                                        {category.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="capacity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Capacidade</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={1}
                                    placeholder="Número de participantes" 
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {eventStatuses.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="eventLink"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Link do Evento</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormItem>
                          <FormLabel>Imagem do Evento</FormLabel>
                          <div className="flex flex-col space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              disabled={isUploading}
                            />
                            {previewUrl && (
                              <div className="mt-2">
                                <img
                                  src={previewUrl}
                                  alt="Preview"
                                  className="h-40 w-full object-cover rounded-md border border-gray-200"
                                />
                              </div>
                            )}
                          </div>
                        </FormItem>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateMutation.isPending || isUploading}
                        className="w-full md:w-auto"
                      >
                        {updateMutation.isPending || isUploading ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Salvando...
                          </div>
                        ) : (
                          "Salvar Alterações"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <h2 className="text-xl font-medium text-gray-900">Evento não encontrado</h2>
              <p className="text-gray-500 mt-2">O evento solicitado não existe ou foi removido</p>
              <Link href="/events">
                <Button className="mt-4">Ver todos os eventos</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}