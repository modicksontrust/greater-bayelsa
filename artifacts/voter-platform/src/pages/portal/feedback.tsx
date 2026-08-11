import { useSubmitFeedback, useListFeedback, useGetMe } from "@workspace/api-client-react";
import { useState } from "react";
import { format } from "date-fns";
import { MessageSquare, ShieldAlert, AlertTriangle, MessageCircle, FileText, Loader2, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function Feedback() {
  const { data: me } = useGetMe({ query: { queryKey: ["/api/me"] } });
  const { data: feedbackList, isLoading } = useListFeedback({
    query: { queryKey: ["/api/feedback"] }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Direct HQ Feedback</h1>
          <p className="text-muted-foreground font-medium">Bypass local leadership to report urgent concerns directly to Headquarters.</p>
        </div>
        <NewFeedbackDialog />
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-bold font-serif mb-1">Non-Anonymous Channel</h3>
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            Reports filed here are attached to your membership profile. HQ reviews these directly. False or malicious reporting violates the membership code.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-serif mb-4">My Submitted Reports</h2>
        
        {isLoading ? (
          [1,2].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
        ) : feedbackList?.length === 0 ? (
          <div className="bg-card rounded-3xl border border-dashed p-16 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">You have not submitted any direct reports.</p>
          </div>
        ) : (
          feedbackList?.map(fb => (
            <div key={fb.id} className="bg-card rounded-2xl border shadow-sm p-6 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4 border-b pb-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                    {fb.category.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {format(new Date(fb.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <Badge variant={fb.status === 'resolved' ? 'default' : (fb.status === 'reviewed' ? 'secondary' : 'outline')} className="font-bold uppercase tracking-wider text-[10px]">
                  {fb.status}
                </Badge>
              </div>
              
              <div className="mb-4">
                <p className="text-foreground/90 font-medium leading-relaxed">{fb.body}</p>
              </div>
              
              {fb.response && (
                <div className="bg-muted/50 rounded-xl p-4 border border-border/50 relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl" />
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1" /> HQ Response
                  </p>
                  <p className="text-sm font-medium leading-relaxed">{fb.response}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NewFeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ category: "leadership_concern" as any, body: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitFeedback = useSubmitFeedback({
    mutation: {
      onSuccess: () => {
        toast({ title: "Report submitted securely to HQ." });
        queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
        setOpen(false);
        setFormData({ category: "leadership_concern", body: "" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback.mutate({ data: formData });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold shadow-sm h-11 px-6">
          <MessageCircle className="w-4 h-4 mr-2" /> File Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-bold font-serif">File Direct Report</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
          <div className="space-y-2">
            <Label className="font-bold">Report Category</Label>
            <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))} required>
              <SelectTrigger className="h-12 bg-muted/50 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leadership_concern">Leadership Concern</SelectItem>
                <SelectItem value="security_issue">Security Issue</SelectItem>
                <SelectItem value="dues_dispute">Dues Dispute</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="font-bold">Detailed Description</Label>
            <Textarea 
              value={formData.body} 
              onChange={e => setFormData(p => ({ ...p, body: e.target.value }))}
              required 
              className="min-h-[200px] bg-muted/50 font-medium leading-relaxed resize-y"
              placeholder="Provide specific details. This will be read directly by HQ personnel..."
            />
          </div>

          <div className="pt-6 border-t flex justify-end">
            <Button type="submit" disabled={submitFeedback.isPending} className="h-12 px-8 font-bold text-base w-full sm:w-auto shadow-sm">
              {submitFeedback.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Submit to HQ
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
