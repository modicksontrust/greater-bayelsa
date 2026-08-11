import { useListFeedback, useUpdateFeedback } from "@workspace/api-client-react";
import { format } from "date-fns";
import { MessageSquare, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminFeedback() {
  const { data: feedbacks, isLoading } = useListFeedback({
    query: { queryKey: ["/api/admin-feedback", "all"] }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-stagger pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Member Feedback</h1>
          <p className="text-muted-foreground font-medium">Review and respond to direct reports from members.</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)
        ) : feedbacks?.length === 0 ? (
          <div className="bg-card rounded-3xl border border-dashed p-16 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No feedback reports found.</p>
          </div>
        ) : (
          feedbacks?.map(fb => <FeedbackCard key={fb.id} feedback={fb} />)
        )}
      </div>
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: any }) {
  const [isExpanding, setIsExpanding] = useState(false);
  const [response, setResponse] = useState(feedback.response || "");
  const [status, setStatus] = useState(feedback.status);
  const { toast } = useToast();

  const updateFeedback = useUpdateFeedback({
    mutation: {
      onSuccess: () => {
        toast({ title: "Feedback updated successfully." });
        setIsExpanding(false);
      }
    }
  });

  const handleUpdate = () => {
    updateFeedback.mutate({
      id: feedback.id,
      data: { status: status as any, response: response || undefined }
    });
  };

  return (
    <div className={`bg-card rounded-3xl border shadow-sm p-6 sm:p-8 transition-colors ${feedback.status === 'open' ? 'border-primary/30' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
              {feedback.category.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
              {format(new Date(feedback.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          <h3 className="text-lg font-bold font-serif mb-1">{feedback.memberName || "Unknown Member"}</h3>
          <p className="text-xs font-mono text-muted-foreground">{feedback.membershipCode}</p>
        </div>
        <Badge variant={feedback.status === 'resolved' ? 'default' : (feedback.status === 'reviewed' ? 'secondary' : 'destructive')} className="font-bold uppercase tracking-wider text-[10px]">
          {feedback.status}
        </Badge>
      </div>

      <div className="bg-muted/30 p-5 rounded-2xl border mb-6 text-sm font-medium leading-relaxed text-foreground/80">
        {feedback.body}
      </div>

      {feedback.response && !isExpanding && (
        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 mb-6 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl" />
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center">
            <ShieldAlert className="w-3 h-3 mr-1" /> HQ Response
          </p>
          <p className="text-sm font-medium leading-relaxed">{feedback.response}</p>
        </div>
      )}

      {!isExpanding ? (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setIsExpanding(true)} className="font-bold">
            Respond & Update
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
                <SelectItem value="reviewed">Reviewed</SelectItem>
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
              placeholder="Write official response to member..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsExpanding(false)} className="font-bold">Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateFeedback.isPending} className="font-bold shadow-sm">
              Save Update
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
