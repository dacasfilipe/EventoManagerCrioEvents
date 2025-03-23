import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import EventCard from "@/components/events/event-card";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function Events() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const [filters, setFilters] = useState({});
  
  // Fetch all events
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Get attendee count for each event
  const { data: attendeeCounts = {} } = useQuery({
    queryKey: ["/api/attendee-counts"],
    queryFn: async () => {
      // In a real application, we would fetch actual counts from the server
      // For demo purposes, we'll generate random counts
      const counts: Record<number, number> = {};
      events.forEach(event => {
        counts[event.id] = Math.floor(Math.random() * 50) + 1;
      });
      return counts;
    },
    enabled: events.length > 0,
  });

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    // Implement search logic here
  };

  const handleFilterApplied = (newFilters: any) => {
    setFilters(newFilters);
    console.log("Applied filters:", newFilters);
    // In a real application, we would refetch with these filters
  };

  const handleDeleteEvent = async (id: number) => {
    setEventToDelete(id);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/events/${eventToDelete}`);
      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    } catch (error) {
      toast({
        title: "Erro ao excluir evento",
        description: "Ocorreu um erro ao excluir o evento.",
        variant: "destructive",
      });
    } finally {
      setEventToDelete(null);
    }
  };

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Header 
          title="Eventos" 
          setIsMobileOpen={setIsMobileOpen} 
          onSearch={handleSearch}
          onFilterApplied={handleFilterApplied}
        />
        
        <div className="p-4 md:p-6 pb-16">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Lista de Eventos</h2>
              <div className="flex items-center">
                <select className="pr-8 pl-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                  <option value="date-asc">Data (mais próxima)</option>
                  <option value="date-desc">Data (mais distante)</option>
                  <option value="name-asc">Nome (A-Z)</option>
                  <option value="name-desc">Nome (Z-A)</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-14 w-14" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </div>
                ))
              ) : sortedEvents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Nenhum evento encontrado</p>
                </div>
              ) : (
                sortedEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    attendeeCount={attendeeCounts[event.id] || 0}
                    onDelete={handleDeleteEvent}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
