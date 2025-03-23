import { Link } from "wouter";
import { Event } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash, Eye } from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";
import AvatarGroup from "@/components/ui/avatar-group";

interface EventCardProps {
  event: Event;
  attendeeCount?: number;
  onDelete?: (id: number) => void;
}

export default function EventCard({ event, attendeeCount = 0, onDelete }: EventCardProps) {
  const eventDate = new Date(event.date);
  const monthFormat = format(eventDate, 'MMM', { locale: ptBR }).toUpperCase();
  const dayFormat = format(eventDate, 'dd');
  
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors duration-150">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 text-center">
          <div className="bg-primary-50 rounded-md p-2">
            <p className="text-xs font-medium text-primary-700">{monthFormat}</p>
            <p className="text-lg font-bold text-primary-700">{dayFormat}</p>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 truncate">{event.name}</h3>
            <StatusBadge status={event.status} />
          </div>
          
          <div className="mt-1 flex items-center text-sm text-gray-500">
            <i className="ri-time-line mr-1"></i>
            <span>{event.startTime} - {event.endTime}</span>
            <span className="mx-2">•</span>
            <i className="ri-map-pin-line mr-1"></i>
            <span>{event.location}</span>
          </div>
          
          <div className="mt-2 flex items-center">
            <AvatarGroup max={3} />
            {attendeeCount > 0 ? (
              <Link href={`/events/${event.id}`} className="ml-2 text-sm text-primary-600 font-medium">
                +{attendeeCount} participantes
              </Link>
            ) : (
              <span className="ml-2 text-sm text-gray-500">Sem participantes</span>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0 self-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={`/events/${event.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Ver detalhes</span>
                </DropdownMenuItem>
              </Link>
              <Link href={`/events/${event.id}/edit`}>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => onDelete && onDelete(event.id)}>
                <Trash className="mr-2 h-4 w-4" />
                <span>Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
