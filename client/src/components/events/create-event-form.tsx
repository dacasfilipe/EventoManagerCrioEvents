import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { eventFormSchema, EventFormValues, eventCategories, eventStatuses } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Clock, Upload, Image, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

interface CreateEventFormProps {
  onSuccess?: () => void;
}

export default function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function onSubmit(data: EventFormValues) {
    setIsSubmitting(true);
    try {
      // Se tiver um arquivo selecionado, faz o upload primeiro
      if (selectedFile) {
        try {
          const imageUrl = await uploadImage(selectedFile);
          data.imageUrl = imageUrl;
        } catch (error) {
          toast({
            title: "Erro ao fazer upload da imagem",
            description: "Não foi possível fazer upload da imagem, mas você pode continuar com a criação do evento.",
            variant: "destructive",
          });
        }
      }

      await apiRequest("POST", "/api/events", data);
      toast({
        title: "Evento criado com sucesso",
        description: "O evento foi adicionado ao sistema.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      if (onSuccess) {
        onSuccess();
      }
      form.reset();
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Erro ao criar evento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar o evento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
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
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      <Input type="time" className="pl-8" {...field} />
                    </div>
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
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      <Input type="time" className="pl-8" {...field} />
                    </div>
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
                <Input placeholder="Digite o local do evento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
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
                <FormLabel>Capacidade máxima</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Número de participantes"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value) || undefined)}
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
              <FormLabel>Status do Evento</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
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
                <div className="relative">
                  <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="https://exemplo.com/seu-evento" 
                    className="pl-8"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormDescription>
                Link para a página oficial ou inscrição do evento (opcional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem</FormLabel>
              <div className="space-y-2">
                <div className="flex items-center gap-x-2">
                  <FormControl>
                    <Input 
                      placeholder="URL da imagem do evento" 
                      {...field} 
                    />
                  </FormControl>
                  <span className="text-sm text-gray-500">ou</span>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          // Criar uma URL temporária para preview
                          const objectUrl = URL.createObjectURL(file);
                          field.onChange(objectUrl);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      className="relative flex items-center gap-x-2"
                    >
                      <Upload size={16} />
                      Carregar imagem
                    </Button>
                  </div>
                </div>

                <div className="flex items-center text-xs text-muted-foreground">
                  <Image size={14} className="mr-1" />
                  Formatos suportados: JPEG, PNG, GIF, WEBP (máx. 5MB)
                </div>
              </div>
              
              <FormMessage />
              
              {(field.value || selectedFile) && (
                <div className="mt-2">
                  <img 
                    src={field.value} 
                    alt="Preview da imagem" 
                    className="h-40 object-cover rounded-md border border-gray-200" 
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/300x150?text=Imagem+Indisponível";
                    }}
                  />
                </div>
              )}
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onSuccess) onSuccess();
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar Evento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
