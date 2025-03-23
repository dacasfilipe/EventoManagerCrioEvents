import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { format, addMonths, subMonths, getDay, getDaysInMonth, isToday, isSameDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";

interface MiniCalendarProps {
  onDateSelect?: (date: Date) => void;
}

// Export as named export as well
export { MiniCalendar };

export default function MiniCalendar({ onDateSelect }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

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
    const monthEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });

    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push({ day: null, hasEvent: false, status: null });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = monthEvents.filter(event => 
        isSameDay(new Date(event.date), date)
      );
      
      let status = null;
      if (dayEvents.length > 0) {
        // Prioritize event status: confirmed > pending > planning > cancelled
        if (dayEvents.some(e => e.status === 'confirmed')) status = 'confirmed';
        else if (dayEvents.some(e => e.status === 'pending')) status = 'pending';
        else if (dayEvents.some(e => e.status === 'planning')) status = 'planning';
        else if (dayEvents.some(e => e.status === 'cancelled')) status = 'cancelled';
      }
      
      calendarDays.push({
        day,
        date,
        hasEvent: dayEvents.length > 0,
        isToday: isToday(date),
        status
      });
    }
    
    return calendarDays;
  };

  const days = createCalendarData();
  
  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Weekday header labels
  const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdays.map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mt-1">
          {days.map((day, index) => (
            <div 
              key={index}
              className={cn(
                "text-sm p-1 calendar-day",
                day.day ? "hover:bg-gray-100 rounded-md cursor-pointer" : "",
                day.isToday ? "bg-primary-50 text-primary-800 rounded-md font-medium" : "",
                day.status === 'confirmed' ? "bg-green-100 text-green-800 rounded-md font-medium" : "",
                day.status === 'pending' ? "bg-yellow-100 text-yellow-800 rounded-md font-medium" : "",
                day.status === 'planning' ? "bg-blue-100 text-blue-800 rounded-md font-medium" : "",
                day.status === 'cancelled' ? "bg-red-100 text-red-800 rounded-md font-medium" : "",
                !day.day ? "text-gray-400" : "text-gray-700"
              )}
              onClick={() => day.day && day.date && handleDateClick(day.date)}
            >
              {day.day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
