import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Bell, HelpCircle, Menu } from "lucide-react";
import CreateEventForm from "@/components/events/create-event-form";
import FilterEventsForm from "@/components/events/filter-events-form";

type HeaderProps = {
  title: string;
  showFilters?: boolean;
  onSearch?: (query: string) => void;
  setIsMobileOpen: (open: boolean) => void;
  onFilterApplied?: (filters: any) => void;
};

export default function Header({
  title,
  showFilters = true,
  onSearch,
  setIsMobileOpen,
  onFilterApplied,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center ml-auto">
          {/* Search */}
          <div className="relative max-w-xs w-full hidden md:block mr-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar eventos..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary ring-2 ring-white"></span>
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon" className="ml-2">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Page Title and Actions */}
      <div className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

        {showFilters && (
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <i className="ri-filter-3-line"></i>
                  Filtrar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Filtrar Eventos</DialogTitle>
                  <DialogDescription>
                    Selecione os critérios para filtrar os eventos
                  </DialogDescription>
                </DialogHeader>
                <FilterEventsForm 
                  onFilterApplied={(filters) => {
                    if (onFilterApplied) {
                      onFilterApplied(filters);
                    }
                    setShowFilterModal(false);
                  }} 
                />
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <i className="ri-add-line"></i>
                  Novo Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Novo Evento</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes para criar um novo evento
                  </DialogDescription>
                </DialogHeader>
                <CreateEventForm onSuccess={() => setShowCreateModal(false)} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </header>
  );
}
