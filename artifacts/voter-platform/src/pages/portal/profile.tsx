import { useState, useRef, useEffect } from "react";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, CheckCircle2, ShieldCheck, MapPin, Briefcase, GraduationCap, Plus, Trash2, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function Profile() {
  const { data: member, isLoading } = useGetMe({
    query: { queryKey: ["/api/me"] }
  });

  const updateMe = useUpdateMe({
    mutation: {
      onSuccess: () => {
        toast({ title: "Profile updated successfully." });
      }
    }
  });

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    phone2: "",
    phone3: "",
    whatsapp: "",
    occupation: "",
    address: "",
    maritalStatus: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    cvUrl: "",
    photoUrl: "",
    stateOfOrigin: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
  });

  // Track how many extra phone fields are visible
  const [extraPhones, setExtraPhones] = useState(0);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (member && !isInitialized.current) {
      const p2 = (member as any).phone2 || "";
      const p3 = (member as any).phone3 || "";
      setFormData({
        email: member.email || "",
        phone: member.phone || "",
        phone2: p2,
        phone3: p3,
        whatsapp: member.whatsapp || "",
        occupation: member.occupation || "",
        address: member.address || "",
        maritalStatus: member.maritalStatus || "",
        nextOfKinName: member.nextOfKinName || "",
        nextOfKinPhone: member.nextOfKinPhone || "",
        cvUrl: member.cvUrl || "",
        photoUrl: member.photoUrl || "",
        stateOfOrigin: (member as any).stateOfOrigin || "",
        bankName: (member as any).bankName || "",
        bankAccountName: (member as any).bankAccountName || "",
        bankAccountNumber: (member as any).bankAccountNumber || "",
      });
      setExtraPhones(p3 ? 2 : p2 ? 1 : 0);
      isInitialized.current = true;
    }
  }, [member]);

  if (isLoading || !member) {
    return <div className="space-y-8 animate-in-stagger">
      <Skeleton className="h-48 w-full rounded-3xl" />
      <Skeleton className="h-[500px] w-full rounded-3xl" />
    </div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMe.mutate({
      data: {
        ...formData,
        phone2: formData.phone2 || null,
        phone3: formData.phone3 || null,
        bankName: formData.bankName || null,
        bankAccountName: formData.bankAccountName || null,
        bankAccountNumber: formData.bankAccountNumber || null,
      } as any
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-stagger">
      {/* Profile header card */}
      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
        <div className="h-32 bg-primary/5 border-b relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative group">
              {formData.photoUrl ? (
                <img
                  src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${formData.photoUrl}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-card shadow-sm bg-muted"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-card shadow-sm bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                  {member.firstName[0]}{member.lastName[0]}
                </div>
              )}
              <ObjectUploader
                onGetUploadParameters={async (file) => {
                  const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage/uploads/request-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || 'application/octet-stream', purpose: 'profile_photo' }),
                  });
                  if (!res.ok) throw new Error("Failed to get URL");
                  const data = await res.json();
                  return { method: 'PUT' as const, url: data.uploadURL, headers: { 'Content-Type': file.type || 'application/octet-stream' }, objectPath: data.objectPath };
                }}
                onComplete={(result) => {
                  const objectPath = (result.successful?.[0]?.meta as any)?.objectPath;
                  if (objectPath) {
                    setFormData(prev => ({ ...prev, photoUrl: objectPath }));
                    updateMe.mutate({ data: { photoUrl: objectPath } });
                  }
                }}
                buttonClassName="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                <Camera className="w-5 h-5 mb-1 mx-auto" />
                Change
              </ObjectUploader>
            </div>
          </div>
          <div className="absolute right-8 top-8">
            <span className="bg-white/80 backdrop-blur border px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Member
            </span>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold font-serif mb-1">{member.firstName} {member.lastName}</h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {member.role.replace(/_/g, ' ')}
                </span>
                • {member.villageName || 'HQ'}
                {member.unitName && ` • ${member.unitName}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Membership Code</p>
              <p className="font-mono text-lg font-bold bg-muted px-3 py-1 rounded-lg border">{member.membershipCode}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 border-t pt-6 text-sm">
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              VIN: <span className="font-bold text-foreground ml-1">{member.vin}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
              Vetting: <span className="font-bold text-foreground ml-1 capitalize">{member.vettingStatus}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Briefcase className="w-4 h-4 mr-2" />
              Category: <span className="font-bold text-foreground ml-1 capitalize">{member.membershipCategory.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border shadow-sm p-8 space-y-8">

        {/* Contact info */}
        <div>
          <h2 className="text-xl font-bold font-serif mb-6">Personal Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="h-12 bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} className="h-12 bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stateOfOrigin">State of Origin</Label>
              <Input id="stateOfOrigin" name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleChange} className="h-12 bg-muted/50" placeholder="e.g. Bayelsa, Rivers, Lagos..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Residential Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} className="h-12 bg-muted/50" />
            </div>
          </div>
        </div>

        {/* Phone numbers */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-bold font-serif mb-6">Phone Numbers</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Primary Phone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="h-12 bg-muted/50" placeholder="+234..." />
            </div>

            {extraPhones >= 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone2">Second Phone</Label>
                  <button type="button" onClick={() => { setExtraPhones(1); setFormData(p => ({ ...p, phone2: "", phone3: "" })); }} className="text-xs text-muted-foreground hover:text-destructive font-bold flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
                <Input id="phone2" name="phone2" value={formData.phone2} onChange={handleChange} className="h-12 bg-muted/50" placeholder="+234..." />
              </div>
            )}

            {extraPhones >= 2 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone3">Third Phone</Label>
                  <button type="button" onClick={() => { setExtraPhones(1); setFormData(p => ({ ...p, phone3: "" })); }} className="text-xs text-muted-foreground hover:text-destructive font-bold flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
                <Input id="phone3" name="phone3" value={formData.phone3} onChange={handleChange} className="h-12 bg-muted/50" placeholder="+234..." />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="h-12 bg-muted/50" placeholder="If different from primary" />
            </div>

            {extraPhones < 2 && (
              <button type="button" onClick={() => setExtraPhones(n => n + 1)} className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-4 h-4" /> Add another phone number
              </button>
            )}
          </div>
        </div>

        {/* Bank details */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-bold font-serif mb-2 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" /> Bank Account Details
          </h2>
          <p className="text-sm text-muted-foreground mb-6">Used by the organisation for payouts. Keep this up to date.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} className="h-12 bg-muted/50" placeholder="e.g. First Bank, GTBank, Access Bank..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountName">Account Name</Label>
              <Input id="bankAccountName" name="bankAccountName" value={formData.bankAccountName} onChange={handleChange} className="h-12 bg-muted/50" placeholder="Name on the account" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Account Number</Label>
              <Input id="bankAccountNumber" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className="h-12 bg-muted/50 font-mono" placeholder="10-digit account number" maxLength={10} />
            </div>
          </div>
        </div>

        {/* Next of kin */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-bold font-serif mb-6">Next of Kin</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nextOfKinName">Full Name</Label>
              <Input id="nextOfKinName" name="nextOfKinName" value={formData.nextOfKinName} onChange={handleChange} className="h-12 bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextOfKinPhone">Phone Number</Label>
              <Input id="nextOfKinPhone" name="nextOfKinPhone" value={formData.nextOfKinPhone} onChange={handleChange} className="h-12 bg-muted/50" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <Button type="submit" disabled={updateMe.isPending} className="font-bold h-12 px-8 shadow-sm">
            {updateMe.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {(member as any).trainingCompletions && (member as any).trainingCompletions.length > 0 && (
        <div className="bg-card rounded-3xl border shadow-sm p-8">
          <h2 className="text-xl font-bold font-serif mb-6 flex items-center">
            <GraduationCap className="w-6 h-6 mr-2 text-primary" /> Completed Trainings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(member as any).trainingCompletions.map((completion: any, idx: number) => (
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
    </div>
  );
}
