import { useState } from "react";
import { Attendee } from "@shared/schema";
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
import { MoreVertical, CheckCircle, XCircle } from "lucide-react";
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

interface AttendeeListProps {
  attendees: Attendee[];
  eventId: number;
}

export default function AttendeeList({ attendees, eventId }: AttendeeListProps) {
  const [attendeeToUpdate, setAttendeeToUpdate] = useState<{id: number, status: string} | null>(null);
  const { toast } = useToast();

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
      
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
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

  if (attendees.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <p className="text-gray-500">Este evento ainda não possui participantes</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.map((attendee) => (
                <TableRow key={attendee.id}>
                  <TableCell className="font-medium">{attendee.name}</TableCell>
                  <TableCell>{attendee.email}</TableCell>
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
      </div>

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
    </>
  );
}
