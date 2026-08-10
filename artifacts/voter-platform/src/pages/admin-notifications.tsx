import { useState, useRef, useEffect } from "react";
import { useSendNotification } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Info } from "lucide-react";

export function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const { toast } = useToast();
  const sendNotification = useSendNotification();
  const sendRef = useRef(sendNotification.mutate);

  useEffect(() => { sendRef.current = sendNotification.mutate; }, [sendNotification.mutate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    sendRef.current({ data: { title, body, memberId: null } }, {
      onSuccess: () => {
        toast({ title: "Broadcast Sent", description: "The notification has been sent to all members." });
        setTitle("");
        setBody("");
      },
      onError: (err: any) => {
        toast({ title: "Failed", description: err?.response?.data?.error || "Error sending broadcast.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in-stagger">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Broadcast Notifications</h1>
        <p className="text-muted-foreground mt-1">Send a message to all members' dashboard inboxes.</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg flex gap-3 text-sm">
        <Info className="h-5 w-5 shrink-0" />
        <p>Broadcasts appear immediately in the "Notifications" tab of every active member's portal. Use this for urgent alerts, meeting reminders, or general announcements.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Compose Broadcast</CardTitle>
          <CardDescription>This will be seen by everyone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Title</label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g., General Meeting this Saturday"
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message Body</label>
              <Textarea 
                value={body} 
                onChange={e => setBody(e.target.value)} 
                placeholder="Type your message here..."
                rows={4} 
                className="resize-none" 
                required 
              />
            </div>
            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button type="submit" disabled={sendNotification.isPending} className="font-bold gap-2">
                {sendNotification.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to All Members
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}