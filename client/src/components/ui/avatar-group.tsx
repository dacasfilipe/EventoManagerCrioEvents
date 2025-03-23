import { AvatarProps, Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarGroupProps {
  max?: number;
  avatars?: {
    name: string;
    src?: string;
  }[];
}

export default function AvatarGroup({ max = 3, avatars }: AvatarGroupProps) {
  // Demo avatars if real data isn't provided
  const demoAvatars = [
    { name: "JD" },
    { name: "AM" },
    { name: "TS" },
    { name: "MP" },
    { name: "FL" },
  ];

  const items = avatars || demoAvatars.slice(0, max + 2);
  const displayAvatars = items.slice(0, max);
  const extraAvatars = items.length > max ? items.length - max : 0;

  return (
    <div className="flex -space-x-1 overflow-hidden">
      {displayAvatars.map((avatar, i) => (
        <Avatar
          key={i}
          className={cn(
            "inline-block h-6 w-6 ring-2 ring-white",
            "bg-gray-200 flex items-center justify-center text-xs"
          )}
        >
          {avatar.src ? <img src={avatar.src} alt={avatar.name} /> : null}
          <AvatarFallback className="text-xs">{avatar.name}</AvatarFallback>
        </Avatar>
      ))}
      
      {extraAvatars > 0 && (
        <Avatar
          className={cn(
            "inline-block h-6 w-6 ring-2 ring-white",
            "bg-gray-200 flex items-center justify-center text-xs"
          )}
        >
          <AvatarFallback className="text-xs">+{extraAvatars}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
