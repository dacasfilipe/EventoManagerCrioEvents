import { Link } from "wouter";
import { Event } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Globe, MapPin, ExternalLink, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/ui/status-badge";

interface EventCardGridProps {
  event: Event;
  attendeeCount?: number;
}

export default function EventCardGrid({ event, attendeeCount = 0 }: EventCardGridProps) {
  const eventDate = new Date(event.date);
  const dateFormatted = format(eventDate, "d 'de' MMMM, yyyy", { locale: ptBR });
  const categoryColors = {
    conference: "bg-blue-100 text-blue-800",
    workshop: "bg-green-100 text-green-800",
    training: "bg-purple-100 text-purple-800",
    webinar: "bg-indigo-100 text-indigo-800",
    meeting: "bg-orange-100 text-orange-800",
    other: "bg-gray-100 text-gray-800",
  };
  
  const categoryColor = categoryColors[event.category] || categoryColors.other;
  
  return (
    <Card className="overflow-hidden flex flex-col h-full transition-all duration-200 hover:shadow-md">
      <div className="relative">
        {event.imageUrl ? (
          <div className="aspect-video overflow-hidden">
            <img 
              src={event.imageUrl.startsWith("http") ? event.imageUrl : window.location.origin + event.imageUrl} 
              alt={event.name} 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/640x360?text=Imagem+Indisponível";
              }}
            />
          </div>
        ) : (
          <div className="aspect-video bg-primary-50 flex items-center justify-center">
            <Calendar className="h-20 w-20 text-primary-300" />
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex gap-2">
          <StatusBadge status={event.status} />
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="outline" className={categoryColor + " border-0"}>
            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
          </Badge>
        </div>
        <CardTitle className="line-clamp-1">{event.name}</CardTitle>
        <CardDescription className="line-clamp-2">{event.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2 flex-1">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-2" />
            <span>{dateFormatted}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-3.5 w-3.5 mr-2" />
            <span>{event.startTime} - {event.endTime}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mr-2" />
            <span className="truncate">{event.location}</span>
          </div>
          
          {event.eventLink && (
            <div className="flex items-center">
              <Globe className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <a 
                href={event.eventLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary truncate flex items-center hover:underline"
              >
                <span className="truncate mr-1">{event.eventLink.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between items-center">
        <div className="flex items-center text-sm">
          <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          {attendeeCount > 0 ? (
            <span>{attendeeCount} participantes</span>
          ) : (
            <span className="text-muted-foreground">Sem participantes</span>
          )}
        </div>
        
        <Link href={`/events/${event.id}`}>
          <Button variant="outline" size="sm">
            Ver detalhes
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}