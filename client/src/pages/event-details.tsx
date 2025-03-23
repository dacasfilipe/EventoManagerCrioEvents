import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Event, Attendee } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, Edit } from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AttendeeForm from "@/components/attendees/attendee-form";
import AttendeeList from "@/components/attendees/attendee-list";
import { eventCategories } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function EventDetails() {
  const [, params] = useRoute("/events/:id");
  const eventId = params?.id ? parseInt(params.id) : null;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showAddAttendeeDialog, setShowAddAttendeeDialog] = useState(false);
  const { toast } = useToast();

  const { data: event, isLoading: isEventLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const { data: attendees = [], isLoading: isAttendeesLoading } = useQuery<Attendee[]>({
    queryKey: [`/api/events/${eventId}/attendees`],
    enabled: !!eventId,
  });

  if (!eventId) {
    return <div>ID de evento inválido</div>;
  }

  const handleAttendeeAdded = () => {
    setShowAddAttendeeDialog(false);
    queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
    toast({
      title: "Participante adicionado",
      description: "O participante foi adicionado com sucesso.",
    });
  };

  const getCategoryLabel = (categoryValue: string) => {
    const category = eventCategories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const getCategoryColor = (categoryValue: string) => {
    const category = eventCategories.find(cat => cat.value === categoryValue);
    switch (category?.color) {
      case 'blue': return "bg-blue-100 text-blue-800";
      case 'green': return "bg-green-100 text-green-800";
      case 'purple': return "bg-purple-100 text-purple-800";
      case 'indigo': return "bg-indigo-100 text-indigo-800";
      case 'orange': return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Header 
          title="Detalhes do Evento" 
          setIsMobileOpen={setIsMobileOpen} 
          showFilters={false}
        />
        
        <div className="p-4 md:p-6 pb-16">
          {isEventLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : event ? (
            <>
              <div className="mb-6 flex justify-between items-center">
                <Link href="/events">
                  <Button variant="outline" size="sm">
                    <i className="ri-arrow-left-line mr-2"></i>
                    Voltar para eventos
                  </Button>
                </Link>
                <Link href={`/events/${event.id}/edit`}>
                  <Button size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Evento
                  </Button>
                </Link>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{event.name}</CardTitle>
                      <CardDescription className="mt-2">{event.description}</CardDescription>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-gray-700">
                          {format(new Date(event.date), "PPPP", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-gray-700">
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-gray-700">{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-gray-700">
                          {event.capacity ? `Capacidade: ${event.capacity} pessoas` : "Capacidade ilimitada"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Categoria</h3>
                        <Badge variant="outline" className={getCategoryColor(event.category)}>
                          {getCategoryLabel(event.category)}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Criado por</h3>
                        <span className="text-gray-700">{event.createdBy || "Administrador"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-medium">Participantes</h2>
                <Button onClick={() => setShowAddAttendeeDialog(true)}>
                  <i className="ri-user-add-line mr-2"></i>
                  Adicionar Participante
                </Button>
              </div>

              {isAttendeesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <AttendeeList 
                  attendees={attendees} 
                  eventId={event.id} 
                />
              )}
            </>
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

      <Dialog open={showAddAttendeeDialog} onOpenChange={setShowAddAttendeeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Participante</DialogTitle>
            <DialogDescription>
              Preencha os dados do participante para o evento.
            </DialogDescription>
          </DialogHeader>
          <AttendeeForm 
            eventId={eventId} 
            onSuccess={handleAttendeeAdded} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
