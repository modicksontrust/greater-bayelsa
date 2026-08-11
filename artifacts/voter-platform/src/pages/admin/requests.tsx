import { useListHqRequests, useUpdateHqRequest } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ShieldAlert, CheckCircle2, ChevronRight, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function AdminRequests() {
  const [filter, setFilter] = useState("all");
  const { data: requests, isLoading } = useListHqRequests(
    { status: filter !== 'all' ? filter : undefined },
    { query: { queryKey: ["/api/hq-requests", filter] } }
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-stagger pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">HQ Requests</h1>
          <p className="text-muted-foreground font-medium">Manage escalated requests from Village Meetings.</p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-card font-semibold h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-40 bg-muted/50 rounded-3xl animate-pulse" />)
        ) : requests?.length === 0 ? (
          <div className="bg-card rounded-3xl border border-dashed p-16 text-center text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold font-serif mb-2">No Requests</h3>
            <p className="font-medium">No HQ requests found matching your filter.</p>
          </div>
        ) : (
          requests?.map(req => (
            <RequestCard key={req.id} request={req} />
          ))
        )}
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: any }) {
  const [isExpanding, setIsExpanding] = useState(false);
  const [response, setResponse] = useState(request.response || "");
  const [status, setStatus] = useState(request.status);
  const { toast } = useToast();

  const updateRequest = useUpdateHqRequest({
    mutation: {
      onSuccess: () => {
        toast({ title: "HQ Request updated successfully." });
        setIsExpanding(false);
      }
    }
  });

  const handleUpdate = () => {
    updateRequest.mutate({
      id: request.id,
      data: { status: status as any, response: response || undefined }
    });
  };

  return (
    <div className={`bg-card rounded-3xl border shadow-sm p-6 sm:p-8 transition-colors ${request.status === 'open' ? 'border-amber-200 bg-amber-50/10' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
              {request.villageName}
            </Badge>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
              {format(new Date(request.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          <h3 className="text-lg font-bold font-serif">Submitted by {request.submitterName}</h3>
        </div>
        <Badge variant={request.status === 'resolved' ? 'default' : (request.status === 'open' ? 'destructive' : 'secondary')} className="font-bold uppercase tracking-wider text-[10px]">
          {request.status}
        </Badge>
      </div>

      <div className="bg-muted/30 p-5 rounded-2xl border mb-6 text-sm font-medium leading-relaxed text-foreground/80">
        {request.body}
      </div>

      {request.response && !isExpanding && (
        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 mb-6 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl" />
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center">
            <ShieldAlert className="w-3 h-3 mr-1" /> HQ Response
          </p>
          <p className="text-sm font-medium leading-relaxed">{request.response}</p>
        </div>
      )}

      {!isExpanding ? (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setIsExpanding(true)} className="font-bold">
            Update Status / Respond
          </Button>
        </div>
      ) : (
        <div className="bg-muted/50 p-6 rounded-2xl border space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-background font-semibold h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">HQ Response</label>
            <Textarea 
              value={response} 
              onChange={e => setResponse(e.target.value)} 
              className="bg-background min-h-[100px]"
              placeholder="Write official response..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsExpanding(false)} className="font-bold">Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateRequest.isPending} className="font-bold shadow-sm">
              Save Update
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
