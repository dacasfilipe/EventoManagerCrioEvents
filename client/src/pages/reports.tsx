import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Calendar, Users, CheckCircle, XCircle, ArrowUpDown, BarChart3, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Event, Attendee } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ReportsPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch events
  const { data: events, isLoading: isEventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  // Fetch attendees
  const { data: attendees, isLoading: isAttendeesLoading } = useQuery<Attendee[]>({
    queryKey: ["/api/attendees"],
  });

  // Fetch stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch category counts
  const { data: categoryCounts, isLoading: isCategoryCountsLoading } = useQuery({
    queryKey: ["/api/categories/counts"],
  });

  // Prepare events data for charts
  const getEventsCountByMonth = () => {
    if (!events) return [];
    
    const months = Array.from({ length: 12 }, (_, i) => {
      return {
        name: format(new Date(selectedYear, i, 1), 'MMMM', { locale: ptBR }),
        count: 0
      };
    });
    
    events.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate.getFullYear() === selectedYear) {
        months[eventDate.getMonth()].count += 1;
      }
    });
    
    return months;
  };

  // Prepare category data for pie chart
  const getCategoryData = () => {
    if (!categoryCounts) return [];
    return categoryCounts;
  };

  // Prepare status data for pie chart
  const getStatusData = () => {
    if (!events) return [];
    
    const statusCounts: Record<string, number> = {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      planning: 0
    };
    
    events.forEach(event => {
      statusCounts[event.status] += 1;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'confirmed' ? 'Confirmado' :
           status === 'pending' ? 'Pendente' :
           status === 'cancelled' ? 'Cancelado' : 'Planejamento',
      value: count
    }));
  };

  // Filter events
  const getFilteredEvents = () => {
    if (!events) return [];
    
    return events.filter(event => {
      // Apply category filter
      if (categoryFilter !== "all" && event.category !== categoryFilter) {
        return false;
      }
      
      // Apply status filter
      if (statusFilter !== "all" && event.status !== statusFilter) {
        return false;
      }
      
      // Apply search query
      if (searchQuery && !event.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };

  // Get attendance rate by event
  const getAttendanceRateByEvent = () => {
    if (!events || !attendees) return [];
    
    return events.map(event => {
      const eventAttendees = attendees.filter(a => a.eventId === event.id);
      const attendanceCount = eventAttendees.length;
      const capacity = event.capacity || 0;
      const rate = capacity > 0 ? (attendanceCount / capacity) * 100 : 0;
      
      return {
        name: event.name,
        rate: rate.toFixed(0),
        attendees: attendanceCount,
        capacity: capacity
      };
    });
  };

  // Define color schemes for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const STATUS_COLORS = {
    Confirmado: '#16a34a',
    Pendente: '#eab308',
    Cancelado: '#dc2626',
    Planejamento: '#3b82f6'
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Relatórios" 
          setIsMobileOpen={setIsMobileOpen}
          onSearch={(query) => setSearchQuery(query)}
        />
        
        <div className="container mx-auto px-4 py-6">
          {isEventsLoading || isAttendeesLoading || isStatsLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Eventos Futuros</p>
                      <p className="text-3xl font-bold">{stats?.upcoming || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Calendar className="h-6 w-6 text-blue-700" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total de Participantes</p>
                      <p className="text-3xl font-bold">{stats?.participants || 0}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Users className="h-6 w-6 text-green-700" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Eventos Concluídos</p>
                      <p className="text-3xl font-bold">{stats?.completed || 0}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <CheckCircle className="h-6 w-6 text-purple-700" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Eventos Cancelados</p>
                      <p className="text-3xl font-bold">{stats?.cancelled || 0}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <XCircle className="h-6 w-6 text-red-700" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Tabs defaultValue="charts" className="mb-8">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="charts">Gráficos</TabsTrigger>
                  <TabsTrigger value="attendance">Taxa de Participação</TabsTrigger>
                  <TabsTrigger value="events">Lista de Eventos</TabsTrigger>
                </TabsList>
                
                {/* Charts Tab */}
                <TabsContent value="charts">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Eventos por Mês</CardTitle>
                          <Select 
                            value={selectedYear.toString()} 
                            onValueChange={(val) => setSelectedYear(parseInt(val))}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Selecionar ano" />
                            </SelectTrigger>
                            <SelectContent>
                              {[2023, 2024, 2025].map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getEventsCountByMonth()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip
                                formatter={(value) => [`${value} eventos`, 'Total']}
                                labelFormatter={(label) => `Mês: ${label}`}
                              />
                              <Bar dataKey="count" fill="#3b82f6" name="Eventos" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Eventos por Categoria</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getCategoryData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="category"
                                label={({ category, count }) => `${category}: ${count}`}
                              >
                                {getCategoryData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [`${value} eventos`, 'Total']}
                                labelFormatter={(label) => `Categoria: ${label}`}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Eventos por Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getStatusData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, value }) => `${name}: ${value}`}
                              >
                                {getStatusData().map((entry) => (
                                  <Cell 
                                    key={`cell-${entry.name}`} 
                                    fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#8884d8'} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [`${value} eventos`, 'Total']}
                                labelFormatter={(label) => `Status: ${label}`}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Attendance Tab */}
                <TabsContent value="attendance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Taxa de Participação por Evento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getAttendanceRateByEvent()}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} unit="%" />
                            <YAxis type="category" dataKey="name" width={80} />
                            <Tooltip
                              formatter={(value, name, props) => {
                                if (name === 'rate') {
                                  return [`${value}%`, 'Taxa de Ocupação'];
                                }
                                return [value, name];
                              }}
                              labelFormatter={(label) => `Evento: ${label}`}
                              contentStyle={{ width: 200 }}
                            />
                            <Bar dataKey="rate" fill="#3b82f6" name="Taxa de Ocupação">
                              {getAttendanceRateByEvent().map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={parseInt(entry.rate) > 75 ? '#16a34a' : parseInt(entry.rate) > 50 ? '#eab308' : '#dc2626'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Attendance Details */}
                  <div className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Detalhes de Participação</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Evento</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Participantes</TableHead>
                              <TableHead>Capacidade</TableHead>
                              <TableHead>Taxa de Ocupação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getAttendanceRateByEvent().map((item, index) => {
                              const event = events?.find(e => e.name === item.name);
                              const rate = parseInt(item.rate);
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell>
                                    {event ? format(new Date(event.date), 'dd/MM/yyyy') : '-'}
                                  </TableCell>
                                  <TableCell>{item.attendees}</TableCell>
                                  <TableCell>{item.capacity || 'Ilimitado'}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        rate > 75 ? "bg-green-100 text-green-800" :
                                        rate > 50 ? "bg-yellow-100 text-yellow-800" :
                                        "bg-red-100 text-red-800"
                                      }
                                    >
                                      {item.rate}%
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Events Tab */}
                <TabsContent value="events">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle>Lista de Eventos</CardTitle>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                          <Select 
                            value={categoryFilter} 
                            onValueChange={setCategoryFilter}
                          >
                            <SelectTrigger className="w-full md:w-[150px]">
                              <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas Categorias</SelectItem>
                              <SelectItem value="conference">Conferência</SelectItem>
                              <SelectItem value="workshop">Workshop</SelectItem>
                              <SelectItem value="training">Treinamento</SelectItem>
                              <SelectItem value="webinar">Webinar</SelectItem>
                              <SelectItem value="meeting">Reunião</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={statusFilter} 
                            onValueChange={setStatusFilter}
                          >
                            <SelectTrigger className="w-full md:w-[150px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos Status</SelectItem>
                              <SelectItem value="confirmed">Confirmado</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                              <SelectItem value="planning">Planejamento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Participantes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredEvents().map((event) => {
                            const eventAttendees = attendees?.filter(a => a.eventId === event.id) || [];
                            
                            return (
                              <TableRow key={event.id}>
                                <TableCell className="font-medium">{event.name}</TableCell>
                                <TableCell>{format(new Date(event.date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {event.category === 'conference' ? 'Conferência' :
                                      event.category === 'workshop' ? 'Workshop' :
                                      event.category === 'training' ? 'Treinamento' :
                                      event.category === 'webinar' ? 'Webinar' :
                                      event.category === 'meeting' ? 'Reunião' : 'Outro'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      event.status === 'confirmed' ? "bg-green-100 text-green-800" :
                                      event.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                                      event.status === 'cancelled' ? "bg-red-100 text-red-800" :
                                      "bg-blue-100 text-blue-800"
                                    }
                                  >
                                    {event.status === 'confirmed' ? 'Confirmado' :
                                      event.status === 'pending' ? 'Pendente' :
                                      event.status === 'cancelled' ? 'Cancelado' : 'Planejamento'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{eventAttendees.length} / {event.capacity || '∞'}</TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {getFilteredEvents().length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                Nenhum evento encontrado com os filtros selecionados.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
}