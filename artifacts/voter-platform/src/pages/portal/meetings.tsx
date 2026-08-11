import { useListMeetings, useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, MapPin, ChevronRight, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";

export function Meetings() {
  const { data: me } = useGetMe({ query: { queryKey: ["/api/me"] } });
  const { data: meetings, isLoading } = useListMeetings({}, {
    query: { queryKey: ["/api/meetings"] }
  });

  const isVillageHead = me?.role === "village_head";

  return (
    <div className="space-y-8 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Monthly Meetings</h1>
          <p className="text-muted-foreground font-medium">Official records of village-level constitutional gatherings.</p>
        </div>
        {isVillageHead && (
          <Link href="/meetings/new" className={buttonVariants({ className: "font-bold shadow-sm" })}>
            Submit New Record
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => (
            <div key={i} className="bg-card rounded-3xl border p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-8" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : meetings?.length === 0 ? (
          <div className="col-span-full bg-card rounded-3xl border border-dashed p-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold font-serif mb-2">No Records Found</h3>
            <p className="font-medium">Monthly meeting updates will appear here.</p>
          </div>
        ) : (
          meetings?.map(meeting => (
            <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="group block">
              <div className="bg-card rounded-3xl border shadow-sm p-6 hover:border-primary/40 transition-colors h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold font-serif text-lg mb-1 flex items-center group-hover:text-primary transition-colors">
                      <MapPin className="w-4 h-4 mr-1.5 text-primary" /> {meeting.villageName}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5" /> 
                      {format(new Date(meeting.heldOn), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex-1 mb-6">
                  <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">
                    {meeting.discussionPoints}
                  </p>
                </div>

                <div className="mt-auto border-t pt-4 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-sm font-bold bg-muted/50 px-3 py-1.5 rounded-lg border">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{meeting.attendanceCount} attended</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
