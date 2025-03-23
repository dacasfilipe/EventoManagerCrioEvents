import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCard from "@/components/dashboard/stats-card";
import CategoryCard from "@/components/dashboard/category-card";
import EventCard from "@/components/events/event-card";
import MiniCalendar from "@/components/ui/mini-calendar";
import ActivityTimeline from "@/components/dashboard/activity-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, UserPlus, CheckSquare, AlertTriangle } from "lucide-react";
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

export default function Dashboard() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: events = [], isLoading: isEventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: categoryCounts = [], isLoading: isCategoryLoading } = useQuery({
    queryKey: ["/api/categories/counts"],
    queryFn: async () => {
      const response = await fetch("/api/categories/counts");
      if (!response.ok) throw new Error("Failed to fetch category counts");
      return response.json();
    },
  });

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    // Implement search logic here
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
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
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

  // Get upcoming events (sorted by date)
  const upcomingEvents = [...(events || [])].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  }).slice(0, 4);

  // Calculate percentage for category cards
  const maxCategoryCount = Math.max(...(categoryCounts.map((c) => c.count) || [1]));
  const categoryCardsWithPercentage = categoryCounts.map((category) => ({
    ...category,
    percentage: (category.count / maxCategoryCount) * 100,
  }));

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Header 
          title="Dashboard" 
          setIsMobileOpen={setIsMobileOpen} 
          onSearch={handleSearch}
        />
        
        <div className="p-4 md:p-6 pb-16">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {isStatsLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : (
              <>
                <StatsCard
                  title="Próximos Eventos"
                  value={stats?.upcoming || 0}
                  icon={<Calendar className="h-5 w-5" />}
                  colorScheme="primary"
                />
                <StatsCard
                  title="Participantes"
                  value={stats?.participants || 0}
                  icon={<UserPlus className="h-5 w-5" />}
                  colorScheme="green"
                />
                <StatsCard
                  title="Eventos Concluídos"
                  value={stats?.completed || 0}
                  icon={<CheckSquare className="h-5 w-5" />}
                  colorScheme="blue"
                />
                <StatsCard
                  title="Cancelamentos"
                  value={stats?.cancelled || 0}
                  icon={<AlertTriangle className="h-5 w-5" />}
                  colorScheme="yellow"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Events List Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Próximos Eventos</h2>
                  <div className="flex items-center">
                    <select className="pr-8 pl-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                      <option value="all">Todos</option>
                      <option value="this-week">Esta Semana</option>
                      <option value="next-week">Próxima Semana</option>
                      <option value="this-month">Este Mês</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {isEventsLoading ? (
                    Array(4).fill(0).map((_, i) => (
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
                  ) : upcomingEvents.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>Nenhum evento próximo</p>
                    </div>
                  ) : (
                    upcomingEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        attendeeCount={Math.floor(Math.random() * 50) + 5} // Random attendee count for demo
                        onDelete={handleDeleteEvent}
                      />
                    ))
                  )}
                </div>

                <div className="border-t border-gray-200 p-3 text-center">
                  <Link href="/events" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    Ver todos os eventos
                  </Link>
                </div>
              </div>

              {/* Event Categories */}
              <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 p-4">
                  <h2 className="text-lg font-medium text-gray-900">Categorias de Eventos</h2>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {isCategoryLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))
                  ) : categoryCardsWithPercentage.length === 0 ? (
                    <div className="col-span-3 p-4 text-center text-gray-500">
                      <p>Nenhuma categoria cadastrada</p>
                    </div>
                  ) : (
                    categoryCardsWithPercentage.slice(0, 3).map((category) => (
                      <CategoryCard 
                        key={category.category}
                        category={category.category}
                        count={category.count}
                        percentage={category.percentage}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Calendar Section */}
            <div className="space-y-6">
              {/* Mini Calendar */}
              <MiniCalendar />
              
              {/* Recent Activity */}
              <ActivityTimeline />
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
