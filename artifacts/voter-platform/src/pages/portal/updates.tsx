import { useListUpdates, useCreateUpdate, useGetMe, useListVillages } from "@workspace/api-client-react";
import { format } from "date-fns";
import { AlertCircle, Bell, ChevronRight, MessageSquare, Plus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export function Updates() {
  const { data: me } = useGetMe({ query: { queryKey: ["/api/me"] } });
  const { data: updates, isLoading } = useListUpdates({
    query: { queryKey: ["/api/community-updates"] }
  });

  const isLeader = ["founder", "assistant", "village_head", "unit_leader"].includes(me?.role || "");
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Community Updates</h1>
          <p className="text-muted-foreground font-medium">Official announcements and urgent dispatches.</p>
        </div>
        {isLeader && <CreateUpdateDialog userRole={me?.role || ""} userVillageId={me?.villageId} />}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)
        ) : updates?.length === 0 ? (
          <div className="bg-card rounded-3xl border border-dashed p-16 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold font-serif mb-2">No Updates Found</h3>
            <p className="font-medium">Recent announcements will appear here.</p>
          </div>
        ) : (
          updates?.map(update => (
            <div key={update.id} className="bg-card rounded-3xl border shadow-sm p-6 sm:p-8 relative overflow-hidden group">
              {update.urgent && (
                <div className="absolute top-0 left-0 w-2 h-full bg-destructive" />
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {update.urgent && (
                    <Badge variant="destructive" className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
                      <AlertCircle className="w-3 h-3 mr-1" /> Urgent
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-primary/10 text-primary font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
                    {update.villageName || "HQ Wide"}
                  </Badge>
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
                  {format(new Date(update.createdAt), 'MMM d, h:mm a')}
                </div>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold font-serif mb-3 leading-snug">
                {update.title}
              </h2>
              
              <p className="text-foreground/80 leading-relaxed font-medium">
                {update.body}
              </p>
              
              <div className="mt-6 pt-4 border-t flex justify-between items-center text-xs font-bold text-muted-foreground">
                <div className="flex items-center gap-1.5 uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {update.authorName?.[0] || "?"}
                  </div>
                  <span>By {update.authorName || "Unknown"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CreateUpdateDialog({ userRole, userVillageId }: { userRole: string, userVillageId?: number | null }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", body: "", urgent: false, villageId: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isHQ = userRole === "founder" || userRole === "assistant";
  
  const { data: villages } = useListVillages({
    query: { enabled: isHQ && open, queryKey: ["/api/villages"] }
  });

  const createUpdate = useCreateUpdate({
    mutation: {
      onSuccess: () => {
        toast({ title: "Update posted successfully." });
        queryClient.invalidateQueries({ queryKey: ["/api/community-updates"] });
        setOpen(false);
        setFormData({ title: "", body: "", urgent: false, villageId: "" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUpdate.mutate({
      data: {
        title: formData.title,
        body: formData.body,
        urgent: formData.urgent,
        villageId: isHQ ? (formData.villageId === "all" ? null : parseInt(formData.villageId)) : userVillageId
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Post Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-bold font-serif">Post New Update</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
          <div className="space-y-2">
            <Label className="font-bold">Subject / Title</Label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              required 
              className="h-12 bg-muted/50 font-medium"
              placeholder="E.g., Monthly Meeting Venue Change"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="font-bold">Message Content</Label>
            <Textarea 
              value={formData.body} 
              onChange={e => setFormData(p => ({ ...p, body: e.target.value }))}
              required 
              className="min-h-[150px] bg-muted/50 font-medium leading-relaxed"
              placeholder="Write the full announcement..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {isHQ && (
              <div className="space-y-2 flex-1 w-full">
                <Label className="font-bold">Audience</Label>
                <Select value={formData.villageId} onValueChange={v => setFormData(p => ({ ...p, villageId: v }))} required>
                  <SelectTrigger className="h-12 bg-muted/50 font-medium">
                    <SelectValue placeholder="Select target..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Organization Wide (All Villages)</SelectItem>
                    {villages?.map(v => (
                      <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-3 bg-destructive/5 p-3 pr-4 rounded-xl border border-destructive/10">
              <Switch 
                checked={formData.urgent} 
                onCheckedChange={c => setFormData(p => ({ ...p, urgent: c }))} 
              />
              <Label className="font-bold text-destructive cursor-pointer">Mark as Urgent</Label>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end">
            <Button type="submit" disabled={createUpdate.isPending} className="h-12 px-8 font-bold text-base w-full sm:w-auto">
              {createUpdate.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Post Announcement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
