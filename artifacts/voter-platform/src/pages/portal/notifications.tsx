import {
  useListNotifications,
  useMarkNotificationRead,
} from "@workspace/api-client-react";
import { Bell, GraduationCap, Megaphone, AlertCircle, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";

function kindIcon(kind: string) {
  switch (kind) {
    case "induction_confirmed":
      return <GraduationCap className="h-5 w-5 text-emerald-600" />;
    case "broadcast":
      return <Megaphone className="h-5 w-5 text-blue-600" />;
    case "dues_reminder":
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
}

function kindBg(kind: string) {
  switch (kind) {
    case "induction_confirmed":
      return "bg-emerald-50 border-emerald-100";
    case "broadcast":
      return "bg-blue-50 border-blue-100";
    case "dues_reminder":
      return "bg-amber-50 border-amber-100";
    default:
      return "bg-muted/40 border-border";
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pt-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Notifications</h1>
          <p className="text-muted-foreground font-medium">Activity related to your membership and duties.</p>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const items = notifications ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in-stagger pt-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Notifications</h1>
        <p className="text-muted-foreground font-medium">Activity related to your membership and duties.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-card rounded-3xl border border-dashed p-16 text-center text-muted-foreground shadow-sm">
          <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-sm">
            <Bell className="h-8 w-8 opacity-40 text-foreground" />
          </div>
          <h3 className="text-xl font-bold font-serif mb-2 text-foreground">You're all caught up.</h3>
          <p className="font-medium text-sm">No new notifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 rounded-2xl border p-4 shadow-sm transition-opacity",
                kindBg(n.kind),
                n.read && "opacity-60",
              )}
            >
              <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl bg-white/70 border border-white/80 flex items-center justify-center shadow-sm">
                {kindIcon(n.kind)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground leading-snug">{n.title}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5 flex-shrink-0">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead.mutate({ id: n.id })}
                  className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white/70 border border-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                  title="Mark as read"
                >
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
