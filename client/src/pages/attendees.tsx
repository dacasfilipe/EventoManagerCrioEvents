import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Event, Attendee } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Eye, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AttendeesPage() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [attendeeToUpdate, setAttendeeToUpdate] = useState<{id: number, status: string} | null>(null);
  const { toast } = useToast();

  // In a real application, we would have an API endpoint to get all attendees
  // Here we'll get all events and their attendees
  const { data: events = [], isLoading: isEventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Load attendees for each event
  const attendeeQueries = events.map(event => {
    return useQuery<Attendee[]>({
      queryKey: [`/api/events/${event.id}/attendees`],
      enabled: events.length > 0,
    });
  });

  const isAttendeesLoading = attendeeQueries.some(query => query.isLoading);

  // Combine all attendees and add event information
  const allAttendees = attendeeQueries.flatMap((query, index) => {
    if (!query.data) return [];
    const event = events[index];
    return query.data.map(attendee => ({
      ...attendee,
      eventName: event.name,
      eventDate: event.date,
    }));
  });

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    // Implement search logic here
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setAttendeeToUpdate({ id, status: newStatus });
  };

  const confirmStatusChange = async () => {
    if (!attendeeToUpdate) return;
    
    try {
      await apiRequest("PUT", `/api/attendees/${attendeeToUpdate.id}`, {
        status: attendeeToUpdate.status
      });
      
      toast({
        title: "Status atualizado",
        description: `O status do participante foi atualizado para ${attendeeToUpdate.status === 'confirmed' ? 'confirmado' : 'cancelado'}.`,
      });
      
      // Invalidate all attendee queries
      events.forEach(event => {
        queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/attendees`] });
      });
      
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Ocorreu um erro ao atualizar o status do participante.",
        variant: "destructive",
      });
    } finally {
      setAttendeeToUpdate(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Header 
          title="Participantes" 
          setIsMobileOpen={setIsMobileOpen} 
          onSearch={handleSearch}
          showFilters={false}
        />
        
        <div className="p-4 md:p-6 pb-16">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEventsLoading || isAttendeesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : allAttendees.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                  <p>Nenhum participante encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allAttendees.map((attendee) => (
                        <TableRow key={`${attendee.eventId}-${attendee.id}`}>
                          <TableCell className="font-medium">{attendee.name}</TableCell>
                          <TableCell>{attendee.email}</TableCell>
                          <TableCell>
                            <Link href={`/events/${attendee.eventId}`} className="text-primary hover:underline">
                              {attendee.eventName}
                            </Link>
                          </TableCell>
                          <TableCell>{getStatusBadge(attendee.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link href={`/events/${attendee.eventId}`}>
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>Ver evento</span>
                                  </DropdownMenuItem>
                                </Link>
                                {attendee.status !== 'confirmed' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(attendee.id, 'confirmed')}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    <span>Confirmar presença</span>
                                  </DropdownMenuItem>
                                )}
                                {attendee.status !== 'cancelled' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(attendee.id, 'cancelled')}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    <span>Cancelar presença</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <AlertDialog open={!!attendeeToUpdate} onOpenChange={() => setAttendeeToUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de status</AlertDialogTitle>
            <AlertDialogDescription>
              {attendeeToUpdate?.status === 'confirmed' 
                ? "Deseja confirmar a presença deste participante?"
                : "Deseja cancelar a presença deste participante?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
