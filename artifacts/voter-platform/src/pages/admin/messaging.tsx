import { useState } from "react";
import { useSendMessage, useListVillages } from "@workspace/api-client-react";
import { Send, Users, Smartphone, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function AdminMessaging() {
  const [formData, setFormData] = useState({ title: "", body: "", target: "all" });
  const { data: villages } = useListVillages({ query: { queryKey: ["/api/villages"] } });
  const { toast } = useToast();

  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Message dispatched", description: `Notified ${data.notified} members.` });
        setFormData({ title: "", body: "", target: "all" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage.mutate({
      data: {
        title: formData.title,
        body: formData.body,
        villageId: formData.target === "all" ? undefined : parseInt(formData.target, 10)
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-stagger pt-4">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Bulk Messaging</h1>
        <p className="text-muted-foreground font-medium">Send SMS/WhatsApp dispatches to members.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-card rounded-3xl border shadow-sm p-8 space-y-6">
            <div className="space-y-2">
              <Label className="font-bold">Target Audience</Label>
              <Select value={formData.target} onValueChange={v => setFormData(p => ({ ...p, target: v }))} required>
                <SelectTrigger className="h-12 bg-muted/50 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Organization Wide (All Members)</SelectItem>
                  {villages?.map(v => <SelectItem key={v.id} value={v.id.toString()}>Village: {v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold">Message Title (Internal/Push)</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                required 
                className="h-12 bg-muted/50 font-medium"
                placeholder="Brief subject..."
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Dispatch Content</Label>
              <Textarea 
                value={formData.body} 
                onChange={e => setFormData(p => ({ ...p, body: e.target.value }))}
                required 
                className="min-h-[150px] bg-muted/50 font-medium resize-y"
                placeholder="Type your message here. Keep it concise for SMS."
              />
              <p className="text-xs text-muted-foreground text-right font-medium mt-1">
                {formData.body.length} characters
              </p>
            </div>

            <div className="pt-6 border-t flex justify-end">
              <Button type="submit" disabled={sendMessage.isPending} className="h-12 px-8 font-bold shadow-sm w-full sm:w-auto">
                {sendMessage.isPending ? "Sending..." : "Dispatch Message"} <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-primary text-white rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold font-serif mb-4 flex items-center"><Smartphone className="w-5 h-5 mr-2" /> Dispatch Channels</h3>
            <ul className="space-y-4 text-sm font-medium text-white/90">
              <li className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">1</div>
                <p>App Notification (Immediate)</p>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">2</div>
                <p>WhatsApp Message (If number provided)</p>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">3</div>
                <p>SMS Fallback</p>
              </li>
            </ul>
          </div>
          
          <div className="bg-muted/50 rounded-3xl border border-dashed p-6">
            <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Preview</h3>
            <div className="bg-card border rounded-2xl p-4 shadow-sm relative before:absolute before:left-4 before:-bottom-2 before:w-4 before:h-4 before:bg-card before:border-b before:border-r before:rotate-45 before:translate-y-px">
              <p className="font-bold text-sm mb-1">{formData.title || "Subject"}</p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {formData.body || "Your message will appear here..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
