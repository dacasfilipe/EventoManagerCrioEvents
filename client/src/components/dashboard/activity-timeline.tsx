import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import {
  User,
  Edit,
  Calendar,
  UserMinus,
  Activity as ActivityIcon
} from "lucide-react";

export default function ActivityTimeline() {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const getIconForActivity = (action: string) => {
    switch (action) {
      case "created":
        return <Calendar className="h-4 w-4" />;
      case "updated":
        return <Edit className="h-4 w-4" />;
      case "rsvp":
        return <User className="h-4 w-4" />;
      case "cancelled":
        return <UserMinus className="h-4 w-4" />;
      default:
        return <ActivityIcon className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-4 px-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2 overflow-y-auto flex-grow max-h-80">
        {isLoading ? (
          <div className="py-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-6 text-center text-gray-500">
            <p>Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.slice(0, 4).map((activity, idx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {idx < activities.slice(0, 4).length - 1 && (
                      <span 
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" 
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ring-8 ring-white">
                          {getIconForActivity(activity.action)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span dangerouslySetInnerHTML={{ __html: activity.description }} />
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-gray-200 p-3 text-center">
        <Link href="/activities" className="w-full">
          <Button variant="link" className="w-full text-primary-600 hover:text-primary-700">
            Ver todas as atividades
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
