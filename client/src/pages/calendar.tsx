import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Calendar from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";

export default function CalendarPage() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Header 
          title="Calendário" 
          setIsMobileOpen={setIsMobileOpen} 
          showFilters={false}
        />
        
        <div className="p-4 md:p-6 pb-16">
          <Calendar events={events} />
          
          {isLoading && (
            <div className="flex justify-center mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
