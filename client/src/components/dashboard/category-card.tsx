import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { eventCategories } from "@shared/schema";

interface CategoryCardProps {
  category: string;
  count: number;
  percentage?: number;
}

export default function CategoryCard({ category, count, percentage = 50 }: CategoryCardProps) {
  const categoryInfo = eventCategories.find(c => c.value === category) || {
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1),
    color: "gray"
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          progress: "bg-blue-600"
        };
      case "green":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          progress: "bg-green-600"
        };
      case "purple":
        return {
          bg: "bg-purple-50",
          text: "text-purple-700",
          progress: "bg-purple-600"
        };
      case "indigo":
        return {
          bg: "bg-indigo-50",
          text: "text-indigo-700",
          progress: "bg-indigo-600"
        };
      case "orange":
        return {
          bg: "bg-orange-50",
          text: "text-orange-700",
          progress: "bg-orange-600"
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          progress: "bg-gray-600"
        };
    }
  };

  const colors = getColorClasses(categoryInfo.color);

  return (
    <Card className={cn("border border-gray-200 p-4", colors.bg)}>
      <div className="flex justify-between items-center">
        <h3 className={cn("font-medium", colors.text)}>{categoryInfo.label}</h3>
        <span className={cn("text-sm", colors.text)}>{count}</span>
      </div>
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn("h-2 rounded-full", colors.progress)} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </Card>
  );
}
