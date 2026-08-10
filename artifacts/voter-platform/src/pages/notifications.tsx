import { useRef, useEffect } from "react";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export function Notifications() {
  const { data: notifications, isLoading } = useListNotifications({ query: { queryKey: ["/api/notifications"] }});
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();
  const markFnRef = useRef(markRead.mutate);

  useEffect(() => { markFnRef.current = markRead.mutate; }, [markRead.mutate]);

  const handleMarkRead = (id: number) => {
    markFnRef.current({ id }, {
      onSuccess: () => {
        // Optimistic update
        queryClient.setQueryData(["/api/notifications"], (old: any) => 
          old?.map((n: any) => n.id === id ? { ...n, read: true } : n)
        );
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in-stagger pb-12">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">Updates and messages from the organization.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="animate-pulse bg-card border border-border/50 rounded-xl h-[100px]" />)}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notif => (
            <Card key={notif.id} className={`border-border/50 shadow-sm transition-colors ${!notif.read ? 'bg-primary/5 border-primary/20' : ''}`}>
              <CardContent className="p-4 sm:p-6 flex gap-4">
                <div className="shrink-0 mt-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${notif.broadcast ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                    {notif.broadcast ? <Users className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4 className={`font-bold font-serif ${!notif.read ? 'text-primary' : 'text-foreground'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notif.body}
                  </p>
                </div>
                {!notif.read && !notif.broadcast && (
                  <div className="shrink-0 pl-2 self-center hidden sm:block">
                    <Button variant="ghost" size="icon" onClick={() => handleMarkRead(notif.id)} title="Mark as read" className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl border border-border/50 shadow-sm">
          <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold font-serif mb-2">You're all caught up</h3>
          <p className="text-muted-foreground">You have no new notifications.</p>
        </div>
      )}
    </div>
  );
}