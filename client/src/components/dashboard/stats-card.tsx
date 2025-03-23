import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  colorScheme?: "primary" | "green" | "blue" | "yellow";
}

export default function StatsCard({ title, value, icon, colorScheme = "primary" }: StatsCardProps) {
  const colorMap = {
    primary: {
      bg: "bg-primary-50",
      text: "text-primary-500",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-500",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-500",
    },
    yellow: {
      bg: "bg-yellow-50",
      text: "text-yellow-500",
    },
  };

  const colors = colorMap[colorScheme];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 p-3 rounded-md", colors.bg, colors.text)}>
            {icon}
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-500">{title}</h2>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
