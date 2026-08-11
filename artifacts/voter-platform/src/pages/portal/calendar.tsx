import { useListEvents, useCreateEvent, useGetMe, useListVillages } from "@workspace/api-client-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Users, Globe, Plus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function Calendar() {
  const { data: me } = useGetMe({ query: { queryKey: ["/api/me"] } });
  const { data: events, isLoading } = useListEvents({
    query: { queryKey: ["/api/events"] }
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const isHQ = me?.role === "founder" || me?.role === "assistant";
  
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Institutional Calendar</h1>
          <p className="text-muted-foreground font-medium">Schedule of monthly meetings and community actions.</p>
        </div>
        {isHQ && <CreateEventDialog />}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-3xl border shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold font-serif capitalize">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>Next</Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border/50 rounded-2xl overflow-hidden border">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-muted/50 p-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {/* Fill empty start days */}
              {Array.from({ length: days[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-card min-h-[100px] p-2 opacity-50" />
              ))}
              
              {days.map(day => {
                const dayEvents = events?.filter(e => isSameDay(new Date(e.startsAt), day)) || [];
                return (
                  <div key={day.toISOString()} className={`bg-card min-h-[100px] p-2 border-t relative transition-colors hover:bg-muted/20 ${isToday(day) ? 'bg-primary/5' : ''}`}>
                    <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold mb-1 ${isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground/70'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-1 mt-1">
                      {dayEvents.map(e => (
                        <div key={e.id} className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate ${
                          e.scope === 'org' ? 'bg-accent/20 text-accent-foreground' : 'bg-primary/10 text-primary'
                        }`}>
                          {format(new Date(e.startsAt), 'h:mm')} • {e.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-3xl border shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
            <h2 className="text-lg font-bold font-serif mb-6 relative z-10">Upcoming Events</h2>
            
            <div className="space-y-4 relative z-10">
              {isLoading ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
              ) : events?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No upcoming events.</p>
                </div>
              ) : (
                events?.slice(0, 5).map(e => (
                  <div key={e.id} className="group border rounded-2xl p-4 hover:border-primary/30 transition-colors shadow-sm bg-background">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{e.title}</h3>
                      <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-bold border-0 ${
                        e.scope === 'org' ? 'bg-accent/20 text-accent-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        {e.scope}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium flex items-center mb-1.5">
                      <CalendarIcon className="w-3 h-3 mr-1.5" />
                      {format(new Date(e.startsAt), 'MMM d, yyyy • h:mm a')}
                    </p>
                    {e.location && (
                      <p className="text-xs text-muted-foreground font-medium flex items-center line-clamp-1">
                        <MapPin className="w-3 h-3 mr-1.5" />
                        {e.location}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: villages } = useListVillages({
    query: { enabled: open, queryKey: ["/api/villages"] }
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    scope: "org" as any,
    villageId: ""
  });

  const createEvent = useCreateEvent({
    mutation: {
      onSuccess: () => {
        toast({ title: "Event scheduled successfully." });
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
        setOpen(false);
        setFormData({ title: "", description: "", location: "", startsAt: "", scope: "org", villageId: "" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate({ 
      data: {
        ...formData,
        startsAt: new Date(formData.startsAt).toISOString(),
        villageId: formData.scope === 'village' ? parseInt(formData.villageId) : undefined
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold shadow-sm h-11 px-6">
          <Plus className="w-4 h-4 mr-2" /> Schedule Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-bold font-serif">Schedule New Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
          <div className="space-y-2">
            <Label className="font-bold">Event Title</Label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              required 
              className="h-12 bg-muted/50 font-medium"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold">Scope</Label>
              <Select value={formData.scope} onValueChange={v => setFormData(p => ({ ...p, scope: v }))} required>
                <SelectTrigger className="h-12 bg-muted/50 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Organization Wide</SelectItem>
                  <SelectItem value="village">Specific Village</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.scope === 'village' && (
              <div className="space-y-2">
                <Label className="font-bold">Village</Label>
                <Select value={formData.villageId} onValueChange={v => setFormData(p => ({ ...p, villageId: v }))} required>
                  <SelectTrigger className="h-12 bg-muted/50 font-medium">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {villages?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Date & Time</Label>
            <Input 
              type="datetime-local"
              value={formData.startsAt} 
              onChange={e => setFormData(p => ({ ...p, startsAt: e.target.value }))}
              required 
              className="h-12 bg-muted/50 font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="font-bold">Location (Optional)</Label>
            <Input 
              value={formData.location} 
              onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
              className="h-12 bg-muted/50 font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="font-bold">Description (Optional)</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              className="min-h-[100px] bg-muted/50 font-medium"
            />
          </div>

          <div className="pt-6 border-t flex justify-end">
            <Button type="submit" disabled={createEvent.isPending} className="h-12 px-8 font-bold text-base w-full sm:w-auto shadow-sm">
              {createEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
