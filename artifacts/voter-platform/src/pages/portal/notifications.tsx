import { useGetOverviewStats } from "@workspace/api-client-react";
import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function Notifications() {
  // Stubbing notifications UI
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in-stagger pt-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Notifications</h1>
        <p className="text-muted-foreground font-medium">Activity related to your membership and duties.</p>
      </div>

      <div className="bg-card rounded-3xl border border-dashed p-16 text-center text-muted-foreground shadow-sm">
        <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-sm">
          <Bell className="h-8 w-8 opacity-40 text-foreground" />
        </div>
        <h3 className="text-xl font-bold font-serif mb-2 text-foreground">You're all caught up.</h3>
        <p className="font-medium text-sm">No new notifications at this time.</p>
      </div>
    </div>
  );
}
