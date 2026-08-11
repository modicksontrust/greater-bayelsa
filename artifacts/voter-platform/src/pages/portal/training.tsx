import { useState } from "react";
import { 
  useListTrainings, 
  useCreateTraining, 
  useRegisterTraining, 
  useUpdateTrainingProgress, 
  useListTrainingRegistrants,
  useGetMe,
  useListVillages,
  getListTrainingsQueryKey,
  getListTrainingRegistrantsQueryKey,
  getGetMeQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, MapPin, Calendar, Users, CheckCircle2, ChevronRight, CheckSquare, Presentation } from "lucide-react";
import { format } from "date-fns";

export function Training() {
  const { data: me } = useGetMe({ query: { queryKey: ["/api/me"] } });
  const { data: trainings, isLoading } = useListTrainings({ query: { queryKey: ["/api/trainings"] } });
  
  const isHQ = Boolean(me?.role === "founder" || me?.role === "assistant");
  const isExec = Boolean(me && ["village_head", "secretary", "treasurer", "assistant", "founder"].includes(me.role));

  return (
    <div className="space-y-8 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Member Development</h1>
          <p className="text-muted-foreground font-medium">Annual training track and institutional capacity building.</p>
        </div>
        
        {isHQ && <CreateTrainingDialog />}
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)
        ) : trainings?.length === 0 ? (
          <div className="bg-card border rounded-3xl p-12 text-center text-muted-foreground">
            <Presentation className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold font-serif text-lg text-foreground mb-1">No upcoming sessions</p>
            <p>New training sessions will appear here when scheduled by HQ.</p>
          </div>
        ) : (
          trainings?.map(training => (
            <TrainingCard key={training.id} training={training} isExec={isExec} me={me} />
          ))
        )}
      </div>
    </div>
  );
}

function CreateTrainingDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: villages } = useListVillages({ query: { queryKey: ["/api/villages"] } });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skillArea: "",
    scheduledOn: "",
    location: "",
    capacity: "",
    villageId: "all"
  });

  const createMutation = useCreateTraining({
    mutation: {
      onSuccess: () => {
        toast({ title: "Training scheduled successfully." });
        queryClient.invalidateQueries({ queryKey: getListTrainingsQueryKey() });
        setOpen(false);
        setFormData({ title: "", description: "", skillArea: "", scheduledOn: "", location: "", capacity: "", villageId: "all" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to schedule", description: err.response?.data?.error, variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        title: formData.title,
        description: formData.description,
        skillArea: formData.skillArea,
        scheduledOn: formData.scheduledOn,
        location: formData.location,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
        villageId: formData.villageId !== "all" ? parseInt(formData.villageId, 10) : undefined
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold h-11 px-6 shadow-sm"><GraduationCap className="w-4 h-4 mr-2" /> Schedule Training</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Schedule Training Session</DialogTitle>
            <DialogDescription>Create a new capacity building session for members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Session Title</Label>
              <Input required value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label>Skill Area / Category</Label>
              <Input required placeholder="e.g. Leadership, Technology, Agriculture" value={formData.skillArea} onChange={e => setFormData(p => ({...p, skillArea: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input type="datetime-local" required value={formData.scheduledOn} onChange={e => setFormData(p => ({...p, scheduledOn: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Capacity (Optional)</Label>
                <Input type="number" min="1" placeholder="Unlimited" value={formData.capacity} onChange={e => setFormData(p => ({...p, capacity: e.target.value}))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location / Venue</Label>
              <Input required value={formData.location} onChange={e => setFormData(p => ({...p, location: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={formData.villageId} onValueChange={v => setFormData(p => ({...p, villageId: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Villages (General)</SelectItem>
                  {villages?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea required className="resize-none" rows={3} value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Scheduling..." : "Schedule Session"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TrainingCard({ training, isExec, me }: { training: any, isExec: boolean, me: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const registerMutation = useRegisterTraining({
    mutation: {
      onSuccess: () => {
        toast({ title: "Successfully registered", description: "Your spot has been reserved." });
        queryClient.invalidateQueries({ queryKey: getListTrainingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Registration failed", description: err.response?.data?.error, variant: "destructive" });
      }
    }
  });

  const handleRegister = () => {
    registerMutation.mutate({ id: training.id });
  };

  return (
    <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-32 h-full bg-emerald-500/5 -skew-x-12 translate-x-8" />
      
      <div className="flex-1 relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">{training.skillArea}</Badge>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
            training.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
            training.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            {training.status.replace('_', ' ')}
          </span>
        </div>
        
        <h2 className="text-2xl font-bold font-serif mb-2">{training.title}</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-2xl">{training.description}</p>
        
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <div className="flex items-center bg-muted/50 rounded-lg px-3 py-1.5 border">
            <Calendar className="w-4 h-4 mr-2 opacity-70" /> {format(new Date(training.scheduledOn), 'MMM d, yyyy • h:mm a')}
          </div>
          <div className="flex items-center bg-muted/50 rounded-lg px-3 py-1.5 border">
            <MapPin className="w-4 h-4 mr-2 opacity-70" /> {training.location}
          </div>
          <div className="flex items-center bg-muted/50 rounded-lg px-3 py-1.5 border">
            <Users className="w-4 h-4 mr-2 opacity-70" /> {training.villageName || "All Villages"}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col justify-center gap-3 min-w-[200px] border-l pl-6 relative z-10">
        <div className="text-center mb-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Attendance</p>
          <p className="font-mono text-xl font-bold">
            {training.registeredCount} <span className="text-muted-foreground text-sm">/ {training.capacity || '∞'}</span>
          </p>
        </div>
        
        {training.myRegistrationStatus ? (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-3 flex items-center justify-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" /> 
            <span className="capitalize">{training.myRegistrationStatus}</span>
          </div>
        ) : training.status === 'scheduled' ? (
          <Button 
            className="w-full font-bold h-11" 
            onClick={handleRegister}
            disabled={registerMutation.isPending || Boolean(training.capacity && training.registeredCount >= training.capacity)}
          >
            {registerMutation.isPending ? "Registering..." : (training.capacity && training.registeredCount >= training.capacity) ? "Session Full" : "Register Now"}
          </Button>
        ) : null}

        {isExec && (
          <RegistrantsDialog training={training} />
        )}
      </div>
    </div>
  );
}

function RegistrantsDialog({ training }: { training: any }) {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full font-bold text-xs"><Users className="w-3 h-3 mr-2" /> Manage Attendees</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> {training.title}</DialogTitle>
          <DialogDescription>Manage attendance and completion status for registered members.</DialogDescription>
        </DialogHeader>
        
        {open && <RegistrantsList trainingId={training.id} />}
      </DialogContent>
    </Dialog>
  );
}

function RegistrantsList({ trainingId }: { trainingId: number }) {
  const { data: registrants, isLoading } = useListTrainingRegistrants(trainingId, {
    query: { queryKey: ["/api/trainings", trainingId, "registrants"] }
  });
  
  if (isLoading) return <div className="py-12"><Skeleton className="h-48 w-full" /></div>;
  if (!registrants || registrants.length === 0) return <div className="py-12 text-center text-muted-foreground font-medium">No registrants yet.</div>;
  
  return (
    <div className="overflow-y-auto flex-1 pr-2">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/30 text-muted-foreground font-bold text-[10px] uppercase tracking-wider sticky top-0 backdrop-blur-md">
          <tr>
            <th className="py-3 px-4">Member</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {registrants.map((reg: any) => (
            <RegistrantRow key={reg.id} reg={reg} trainingId={trainingId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegistrantRow({ reg, trainingId }: { reg: any, trainingId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateMutation = useUpdateTrainingProgress({
    mutation: {
      onSuccess: () => {
        toast({ title: "Status updated" });
        queryClient.invalidateQueries({ queryKey: ["/api/trainings", trainingId, "registrants"] });
        queryClient.invalidateQueries({ queryKey: getListTrainingsQueryKey() });
      }
    }
  });

  const handleUpdate = (status: 'attended' | 'completed') => {
    updateMutation.mutate({
      id: trainingId,
      data: { userIds: [reg.userId], status }
    });
  };

  return (
    <tr className="hover:bg-muted/10">
      <td className="py-3 px-4">
        <p className="font-bold">{reg.memberName}</p>
        <p className="text-xs text-muted-foreground font-mono">{reg.membershipCode}</p>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          reg.status === 'registered' ? 'bg-blue-100 text-blue-700' :
          reg.status === 'attended' ? 'bg-amber-100 text-amber-700' :
          'bg-emerald-100 text-emerald-700'
        }`}>
          {reg.status}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex justify-end gap-2">
          {reg.status === 'registered' && (
            <Button size="sm" variant="outline" className="h-7 text-xs font-bold" onClick={() => handleUpdate('attended')} disabled={updateMutation.isPending}>
              Mark Attended
            </Button>
          )}
          {(reg.status === 'registered' || reg.status === 'attended') && (
            <Button size="sm" className="h-7 text-xs font-bold" onClick={() => handleUpdate('completed')} disabled={updateMutation.isPending}>
              <CheckSquare className="w-3 h-3 mr-1" /> Complete
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
