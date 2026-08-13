import { useGetMember, useUpdateMember, useGetMe, useConfirmMemberInduction, getGetMemberQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, CheckCircle2, Shield, Calendar, Phone, Briefcase, FileText, GraduationCap, Video, Image as ImageIcon, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function MemberDetail() {
  const [, params] = useRoute("/members/:id");
  const id = parseInt(params?.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me } = useGetMe({ query: { queryKey: ["/api/me"] } });
  
  const { data: member, isLoading } = useGetMember(id, {
    query: { 
      enabled: !!id,
      queryKey: ["/api/members", id]
    }
  });

  const updateMember = useUpdateMember({
    mutation: {
      onSuccess: () => {
        toast({ title: "Member updated successfully." });
      }
    }
  });

  const confirmInduction = useConfirmMemberInduction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Induction confirmed!", description: "Member has been activated as a Full Member." });
        queryClient.invalidateQueries({ queryKey: getGetMemberQueryKey(id) });
      },
      onError: (err: any) => {
        toast({ title: "Confirmation failed", description: err.response?.data?.error || "Unknown error", variant: "destructive" });
      },
    },
  });

  if (isLoading || !member) {
    return <div className="space-y-6 max-w-4xl mx-auto">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>;
  }

  const isHQ = me?.role === "founder" || me?.role === "assistant";

  const handleRoleChange = (newRole: string) => {
    updateMember.mutate({ 
      id: member.id,
      data: { 
        role: newRole,
        villageId: member.villageId || undefined,
        unitId: member.unitId || undefined
      } 
    });
  };

  const handleStatusChange = (newStatus: string) => {
    updateMember.mutate({ 
      id: member.id,
      data: { 
        status: newStatus,
        villageId: member.villageId || undefined,
        unitId: member.unitId || undefined
      } 
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in-stagger">
      <div>
        <Link href="/members" className="inline-flex items-center text-muted-foreground hover:text-foreground font-medium transition-colors mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
        </Link>
      </div>

      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
        <div className="h-24 bg-muted/50 border-b relative">
          <div className="absolute -bottom-10 left-8">
            {member.photoUrl ? (
              <img 
                src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${member.photoUrl}`} 
                alt="Profile" 
                className="w-20 h-20 rounded-2xl object-cover border-4 border-card shadow-sm bg-background" 
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl border-4 border-card shadow-sm bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {member.firstName[0]}{member.lastName[0]}
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-14 pb-8 px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold font-serif mb-1">{member.firstName} {member.lastName}</h1>
              <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                {member.villageName || 'HQ'}
                {member.unitName && ` • ${member.unitName}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                {member.membershipCode}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 border-t pt-6 text-sm">
            <div className="flex items-center text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
              <Phone className="w-4 h-4 mr-2 text-foreground" />
              {member.phone}
            </div>
            <div className="flex items-center text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
              <Briefcase className="w-4 h-4 mr-2 text-foreground" />
              {member.occupation || "No occupation listed"}
            </div>
            <div className="flex items-center text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
              <Calendar className="w-4 h-4 mr-2 text-foreground" />
              Joined {format(new Date(member.createdAt), 'MMM yyyy')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-3xl border shadow-sm p-8">
          <h2 className="text-lg font-bold font-serif mb-6 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" /> Institutional Status
          </h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Role</p>
              {isHQ ? (
                <Select value={member.role} onValueChange={handleRoleChange} disabled={updateMember.isPending}>
                  <SelectTrigger className="h-10 font-semibold bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="unit_leader">Unit Leader</SelectItem>
                    <SelectItem value="secretary">Secretary</SelectItem>
                    <SelectItem value="treasurer">Treasurer</SelectItem>
                    <SelectItem value="village_head">Village Head</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-semibold text-sm capitalize">{member.role.replace('_', ' ')}</div>
              )}
            </div>
            
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
              {isHQ ? (
                <Select value={member.status} onValueChange={handleStatusChange} disabled={updateMember.isPending}>
                  <SelectTrigger className="h-10 font-semibold bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center font-semibold text-sm capitalize">
                  {member.status === 'active' && <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />}
                  {member.status}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Vetting Status</p>
              <div className="flex items-center text-sm font-semibold capitalize">
                {member.vettingStatus === 'verified' ? (
                  <span className="text-emerald-600 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1.5" /> Verified</span>
                ) : (
                  member.vettingStatus
                )}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">VIN Cross-Check</p>
              <div className="text-sm font-mono bg-muted/50 border px-3 py-2 rounded-md">
                {member.vin}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border shadow-sm p-8">
          <h2 className="text-lg font-bold font-serif mb-6 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" /> Profile Details
          </h2>
          
          <div className="space-y-6 text-sm">
            {member.bio ? (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Biography</p>
                <p className="text-foreground/80 leading-relaxed bg-muted/30 p-4 rounded-xl border">{member.bio}</p>
              </div>
            ) : null}
            
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Address</p>
              <p className="font-medium">{member.address || "Not provided"}</p>
            </div>
            
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Next of Kin</p>
              <p className="font-medium">{member.nextOfKinName || "Not provided"}</p>
              {member.nextOfKinPhone && <p className="text-muted-foreground mt-1">{member.nextOfKinPhone}</p>}
            </div>

            {member.cvUrl && (
              <div>
                <a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${member.cvUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary font-bold hover:underline">
                  <FileText className="w-4 h-4 mr-2" /> View Uploaded CV
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {member.trainingCompletions && member.trainingCompletions.length > 0 && (
        <div className="bg-card rounded-3xl border shadow-sm p-8">
          <h2 className="text-lg font-bold font-serif mb-6 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-primary" /> Training Completions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {member.trainingCompletions.map((completion: any, idx: number) => (
              <div key={idx} className="bg-muted/30 border rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold leading-tight">{completion.title}</h3>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{completion.skillArea}</Badge>
                </div>
                <div className="mt-auto pt-2 flex items-center text-xs text-muted-foreground font-medium">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                  Completed {format(new Date(completion.completedAt), 'MMM d, yyyy')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Induction Review Panel — Village Head / HQ only, when pledge submitted */}
      {me?.role === "village_head" &&
        (member as any).inductionStatus === "pledge_submitted" && (
        <div className="bg-card rounded-3xl border-2 border-amber-200 shadow-sm p-8">
          <h2 className="text-lg font-bold font-serif mb-2 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" /> Induction Review
          </h2>
          <p className="text-sm text-muted-foreground font-medium mb-6">
            Review the pledge video and ceremony photos below, then confirm the induction to activate Full Membership.
          </p>

          {/* Pledge Video */}
          {(member as any).inductionVideoPath && (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Video className="w-3.5 h-3.5" /> Pledge Video
              </p>
              <div className="rounded-2xl overflow-hidden border bg-black aspect-video max-w-xl">
                <video
                  src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${(member as any).inductionVideoPath}`}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Ceremony Photos */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" /> Ceremony Photos
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              {[(member as any).inductionPhoto1Path, (member as any).inductionPhoto2Path]
                .filter(Boolean)
                .map((path: string, i: number) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden border bg-muted">
                    <img
                      src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${path}`}
                      alt={`Ceremony photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>

          <Button
            className="h-12 px-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            disabled={confirmInduction.isPending}
            onClick={() => confirmInduction.mutate({ id: member.id })}
          >
            {confirmInduction.isPending ? "Confirming..." : "Confirm Induction — Activate Full Membership"}
          </Button>
        </div>
      )}

      {/* Inducted badge */}
      {(member as any).inductionStatus === "inducted" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-emerald-800">Full Member — Inducted</p>
            <p className="text-sm text-emerald-700 font-medium">
              {(member as any).inductedAt
                ? format(new Date((member as any).inductedAt), "MMMM d, yyyy")
                : "Induction date recorded"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
