import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { format, addMonths, subMonths, getDay, getDaysInMonth, isToday, isSameDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import CreateEventForm from "@/components/events/create-event-form";

interface CalendarProps {
  events?: Event[];
}

// Also make this component available as a named export
export { Calendar };

export default function Calendar({ events }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: fetchedEvents } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: !events,
  });

  const allEvents = events || fetchedEvents || [];

  const handlePreviousMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

  // Create calendar data
  const createCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getDay(new Date(year, month, 1));
    
    // Get events for the current month
    const monthEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });

    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push({ day: null, hasEvent: false, events: [] });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = monthEvents.filter(event => 
        isSameDay(new Date(event.date), date)
      );
      
      calendarDays.push({
        day,
        date,
        hasEvent: dayEvents.length > 0,
        isToday: isToday(date),
        events: dayEvents,
      });
    }
    
    return {
      days: calendarDays,
      totalEvents: monthEvents.length,
    };
  };

  const { days, totalEvents } = createCalendarData();
  
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [showEventsModal, setShowEventsModal] = useState(false);

  const handleDateClick = (date: Date, events: Event[]) => {
    setSelectedDate(date);
    
    if (events.length > 0) {
      // Se há eventos neste dia, mostrar o modal com os eventos
      setSelectedEvents(events);
      setShowEventsModal(true);
    } else {
      // Se não há eventos, mostrar o modal para criar um novo
      setShowCreateModal(true);
    }
  };

  // Weekday header labels
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {totalEvents} eventos neste mês
        </p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-gray-500 text-center p-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div 
              key={index}
              className={cn(
                "aspect-square p-1 text-center",
                day.day ? "cursor-pointer hover:bg-gray-100 rounded-md" : "",
                day.isToday ? "bg-primary-50 rounded-md" : "",
                day.hasEvent ? "font-medium" : ""
              )}
              onClick={() => day.day && handleDateClick(day.date!, day.events || [])}
            >
              {day.day && (
                <>
                  <div className={cn(
                    "text-sm w-full h-full flex flex-col items-center justify-center",
                    day.hasEvent && "relative"
                  )}>
                    <span className={cn(
                      day.isToday ? "text-primary-800" : "text-gray-800",
                      day.hasEvent ? "font-medium" : ""
                    )}>
                      {day.day}
                    </span>
                    
                    {day.hasEvent && (
                      <div className="flex mt-1 space-x-0.5 justify-center">
                        {day.events?.slice(0, 3).map((event, i) => (
                          <div 
                            key={i}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              event.status === 'confirmed' ? "bg-green-500" :
                              event.status === 'pending' ? "bg-yellow-500" : 
                              event.status === 'cancelled' ? "bg-red-500" : "bg-blue-500"
                            )}
                          ></div>
                        ))}
                        {(day.events?.length || 0) > 3 && (
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal para criar um novo evento */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Evento</DialogTitle>
            <DialogDescription>
              Criar um evento para {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : ""}
            </DialogDescription>
          </DialogHeader>
          <CreateEventForm onSuccess={() => setShowCreateModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal para exibir eventos existentes */}
      <Dialog open={showEventsModal} onOpenChange={setShowEventsModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Eventos do Dia</DialogTitle>
            <DialogDescription>
              Eventos para {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-lg">{event.name}</h3>
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      event.status === 'confirmed' ? "bg-green-100 text-green-800" :
                      event.status === 'pending' ? "bg-yellow-100 text-yellow-800" : 
                      event.status === 'cancelled' ? "bg-red-100 text-red-800" : 
                      "bg-blue-100 text-blue-800"
                    )}>
                      {event.status === 'confirmed' ? "Confirmado" :
                       event.status === 'pending' ? "Pendente" :
                       event.status === 'cancelled' ? "Cancelado" : "Planejamento"}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{event.location}</span>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button asChild variant="outline" size="sm" className="mr-2">
                      <a href={`/events/${event.id}`}>Ver Detalhes</a>
                    </Button>
                    <Button asChild variant="default" size="sm">
                      <a href={`/events/${event.id}/edit`}>Editar</a>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Nenhum evento encontrado nesta data.</p>
            )}
          </div>
          
          <div className="mt-4 border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEventsModal(false);
                setShowCreateModal(true);
              }}
              className="w-full"
            >
              Adicionar Novo Evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
