import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { eventStatuses } from "@shared/schema";

type StatusBadgeProps = {
  status: string;
  size?: "sm" | "default";
};

export default function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const statusInfo = eventStatuses.find(s => s.value === status) || { 
    value: status, 
    label: status.charAt(0).toUpperCase() + status.slice(1), 
    color: "gray" 
  };

  const getStatusClasses = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-100 text-green-800";
      case "yellow":
        return "bg-yellow-100 text-yellow-800";
      case "red":
        return "bg-red-100 text-red-800";
      case "blue":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        getStatusClasses(statusInfo.color), 
        "font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : ""
      )}
    >
      {statusInfo.label}
    </Badge>
  );
}
