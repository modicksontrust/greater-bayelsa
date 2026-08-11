import { useState, useRef, useMemo } from "react";
import { useEnrollMember, useListVillages, useListVillageUnits, useMatchVoter } from "@workspace/api-client-react";
import { ObjectUploader, useUpload } from "@workspace/object-storage-web";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle2, Search, XCircle, FileUp, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export function Enroll() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: villages } = useListVillages({ query: { queryKey: ["/api/villages"] } });
  const [villageId, setVillageId] = useState<string>("");
  const { data: units } = useListVillageUnits(parseInt(villageId || "0", 10), { 
    query: { queryKey: ["/api/villages", villageId, "units"] } 
  });

  const [vinQuery, setVinQuery] = useState("");
  const { data: vinMatches, isLoading: vinLoading } = useMatchVoter(
    { q: vinQuery },
    { query: { enabled: vinQuery.length >= 3, queryKey: ["/api/members/match", vinQuery] } }
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    vin: "",
    dateOfBirth: "",
    gender: "",
    occupation: "",
    address: "",
    maritalStatus: "single",
    unitId: "",
    membershipCategory: "full_time" as any,
    password: "",
    email: "",
    whatsapp: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    bio: "",
    photoUrl: "",
    cvUrl: ""
  });

  const enrollMutation = useEnrollMember({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Member enrolled successfully!" });
        setLocation(`/members/${data.id}`);
      },
      onError: (err: any) => {
        toast({ title: "Enrollment failed", description: err.response?.data?.error || "Unknown error", variant: "destructive" });
      }
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectVoter = (voter: any) => {
    setFormData(prev => ({
      ...prev,
      firstName: voter.firstName,
      lastName: voter.lastName,
      vin: voter.vin || "",
      phone: voter.phone || prev.phone,
      gender: voter.gender || prev.gender,
      occupation: voter.occupation || prev.occupation,
      dateOfBirth: voter.dateOfBirth || prev.dateOfBirth
    }));
    if (voter.villageId) setVillageId(voter.villageId.toString());
    setVinQuery(voter.vin || "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.photoUrl) {
      toast({ title: "Photo required", description: "A profile photo is mandatory for enrollment.", variant: "destructive" });
      return;
    }
    
    if (!formData.bio && !formData.cvUrl) {
      toast({ title: "Bio or CV required", description: "You must provide either a biography or upload a CV.", variant: "destructive" });
      return;
    }

    const payload = {
      ...formData,
      villageId: parseInt(villageId, 10),
      unitId: parseInt(formData.unitId, 10)
    };

    enrollMutation.mutate({ data: payload });
  };

  // Basic client-side age check
  const isAdult = useMemo(() => {
    if (!formData.dateOfBirth) return null;
    const dob = new Date(formData.dateOfBirth);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs); 
    return Math.abs(ageDate.getUTCFullYear() - 1970) >= 18;
  }, [formData.dateOfBirth]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in-stagger">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Enroll New Member</h1>
        <p className="text-muted-foreground font-medium">Verify credentials and register a new member into the leadership pipeline.</p>
      </div>

      <div className="bg-card rounded-3xl border shadow-sm p-8 mb-8 border-primary/20 bg-primary/5">
        <Label className="text-sm font-bold uppercase tracking-wider text-primary mb-3 block">Step 1: Voter Roll Verification</Label>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            value={vinQuery}
            onChange={e => setVinQuery(e.target.value)}
            placeholder="Search Voter Roll by VIN or Phone..."
            className="pl-10 h-12 bg-white border-primary/20"
          />
        </div>
        
        {vinQuery.length >= 3 && (
          <div className="bg-white rounded-xl border shadow-sm max-h-64 overflow-y-auto p-2">
            {vinLoading ? (
              <div className="p-4 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
            ) : vinMatches?.length ? (
              vinMatches.map(voter => (
                <div 
                  key={voter.id} 
                  onClick={() => handleSelectVoter(voter)}
                  className="p-3 hover:bg-muted/50 rounded-lg cursor-pointer flex justify-between items-center group transition-colors"
                >
                  <div>
                    <p className="font-bold">{voter.firstName} {voter.lastName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{voter.vin}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 font-bold">Select</Button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-destructive font-medium flex flex-col items-center">
                <XCircle className="w-8 h-8 mb-2 opacity-50" />
                No match found on the official voter roll.
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-muted/20">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 block">Step 2: Identity & Assignment</Label>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="shrink-0">
              <Label className="block mb-3 font-bold">Profile Photo <span className="text-destructive">*</span></Label>
              <div className="relative group w-32 h-32">
                {formData.photoUrl ? (
                  <img src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${formData.photoUrl}`} className="w-full h-full rounded-2xl object-cover border-4 border-card shadow-sm bg-muted" />
                ) : (
                  <div className="w-full h-full rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-bold uppercase">Upload</span>
                  </div>
                )}
                <ObjectUploader
                  onGetUploadParameters={async (file) => {
                    const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage/uploads/request-url`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type, purpose: 'profile_photo' }),
                    });
                    if (!res.ok) throw new Error("Failed to get URL");
                    const data = await res.json();
                    return { method: 'PUT' as const, url: data.uploadURL, headers: { 'Content-Type': file.type }, objectPath: data.objectPath };
                  }}
                  onComplete={(result) => {
                    const objectPath = (result.successful?.[0]?.meta as any)?.objectPath;
                    if (objectPath) {
                      setFormData(prev => ({ ...prev, photoUrl: objectPath }));
                    }
                  }}
                  buttonClassName="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <span className="sr-only">Upload photo</span>
                </ObjectUploader>
              </div>
            </div>

            <div className="flex-1 grid md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input name="firstName" value={formData.firstName} onChange={handleChange} required className="h-12 bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Last Name <span className="text-destructive">*</span></Label>
                <Input name="lastName" value={formData.lastName} onChange={handleChange} required className="h-12 bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>VIN <span className="text-destructive">*</span></Label>
                <Input name="vin" value={formData.vin} onChange={handleChange} required className="h-12 bg-muted/50 font-mono" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth <span className="text-destructive">*</span></Label>
                <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="h-12 bg-muted/50" />
                {isAdult === false && <p className="text-xs text-destructive font-bold mt-1">Must be 18 or older.</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label>Village Assignment <span className="text-destructive">*</span></Label>
              <Select value={villageId} onValueChange={setVillageId} required>
                <SelectTrigger className="h-12 bg-muted/50 font-semibold"><SelectValue placeholder="Select Village" /></SelectTrigger>
                <SelectContent>
                  {villages?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit Assignment <span className="text-destructive">*</span></Label>
              <Select value={formData.unitId} onValueChange={v => setFormData(p => ({...p, unitId: v}))} disabled={!villageId} required>
                <SelectTrigger className="h-12 bg-muted/50 font-semibold"><SelectValue placeholder="Select Unit" /></SelectTrigger>
                <SelectContent>
                  {units?.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Phone Number <span className="text-destructive">*</span></Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} required className="h-12 bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Login Password <span className="text-destructive">*</span></Label>
              <Input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} className="h-12 bg-muted/50" placeholder="Minimum 8 characters" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Coordinator Biography <span className="text-muted-foreground font-normal text-xs">(Required if no CV)</span></Label>
              <Textarea 
                name="bio" 
                value={formData.bio} 
                onChange={handleChange as any} 
                placeholder="Write a brief evaluation of the member's background and suitability for the leadership pipeline..."
                className="min-h-[100px] bg-muted/50 resize-y mb-4" 
              />
              <div className="flex items-center gap-4 border p-4 rounded-xl bg-background">
                <div className="flex-1">
                  <p className="font-bold text-sm">Upload CV</p>
                  <p className="text-xs text-muted-foreground">PDF or Document (Required if no bio)</p>
                </div>
                <ObjectUploader
                  onGetUploadParameters={async (file) => {
                    const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage/uploads/request-url`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type, purpose: 'cv' }),
                    });
                    if (!res.ok) throw new Error("Failed to get URL");
                    const data = await res.json();
                    return { method: 'PUT' as const, url: data.uploadURL, headers: { 'Content-Type': file.type }, objectPath: data.objectPath };
                  }}
                  onComplete={(result) => {
                    const objectPath = (result.successful?.[0]?.meta as any)?.objectPath;
                    if (objectPath) {
                      setFormData(prev => ({ ...prev, cvUrl: objectPath }));
                      toast({ title: "CV uploaded successfully" });
                    }
                  }}
                  buttonClassName="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-4 py-2 rounded-lg font-bold text-sm cursor-pointer border border-primary/20"
                >
                  <FileUp className="w-4 h-4" /> {formData.cvUrl ? "Replace CV" : "Upload CV"}
                </ObjectUploader>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t bg-muted/10 flex justify-end">
          <Button 
            type="submit" 
            size="lg" 
            className="h-12 px-8 font-bold shadow-sm"
            disabled={enrollMutation.isPending || (isAdult === false)}
          >
            {enrollMutation.isPending ? "Enrolling..." : "Enroll Member"}
          </Button>
        </div>
      </form>
    </div>
  );
}
