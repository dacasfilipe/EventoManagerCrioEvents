import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type SidebarProps = {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
};

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    {
      title: "Principal",
      items: [
        { name: "Dashboard", href: "/", icon: "ri-dashboard-line" },
        { name: "Calendário", href: "/calendar", icon: "ri-calendar-line" },
        { name: "Participantes", href: "/attendees", icon: "ri-group-line" },
      ],
    },
    {
      title: "Gestão",
      items: [
        { name: "Eventos", href: "/events", icon: "ri-folder-line" },
        { name: "Relatórios", href: "/reports", icon: "ri-bar-chart-line" },
        { name: "Configurações", href: "/settings", icon: "ri-settings-line" },
      ],
    },
  ];

  const sidebarClasses = cn(
    "bg-white shadow-sm border-r border-gray-200",
    "md:w-64 md:flex-shrink-0 md:h-screen md:sticky md:top-0",
    "flex flex-col h-full",
    isMobileOpen ? "fixed inset-0 z-40" : "hidden md:flex"
  );

  return (
    <aside className={sidebarClasses}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <i className="ri-calendar-event-fill text-primary text-xl"></i>
            <span className="font-semibold text-lg">EventoPro</span>
          </div>
          <button
            className="md:hidden text-gray-500"
            onClick={() => setIsMobileOpen(false)}
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 flex-grow overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((section) => (
              <div key={section.title}>
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                        isActive
                          ? "bg-primary-50 text-primary-600"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <i className={`${item.icon} mr-3 text-lg`}></i>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                JD
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">João Dias</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            <div className="ml-auto">
              <button className="text-gray-400 hover:text-gray-500">
                <i className="ri-logout-box-r-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
