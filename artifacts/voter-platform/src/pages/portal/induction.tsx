import { useState, useRef } from "react";
import {
  useGetMe,
  useGetMyDues,
  useInductionUploadMember,
  useConfirmMemberInduction,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Clock, Lock, Video, Image as ImageIcon,
  Upload, Award, ChevronRight, Shield, CreditCard, UserCheck,
  Star,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

const PIPELINE_STAGES = [
  { key: "enrolled",   label: "Enrolled",             icon: UserCheck  },
  { key: "vetted",     label: "Vetted",                icon: Shield     },
  { key: "dues",       label: "Dues Paid",             icon: CreditCard },
  { key: "pledge",     label: "Pledge Submitted",      icon: Upload     },
  { key: "confirmed",  label: "Village Head Confirmed", icon: Star       },
  { key: "inducted",   label: "Full Member",           icon: Award      },
];

function getPipelineStage(member: any, duesPaid: boolean): string {
  if (member.inductionStatus === "inducted") return "inducted";
  if (member.inductionStatus === "pledge_submitted") return "pledge";
  if (duesPaid) return "dues";
  if (member.vettingStatus === "vetted") return "vetted";
  return "enrolled";
}

function stageIndex(stageKey: string) {
  return PIPELINE_STAGES.findIndex((s) => s.key === stageKey);
}

export function Induction() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me, isLoading: meLoading } = useGetMe({ query: { queryKey: ["/api/me"] } });
  const { data: dues, isLoading: duesLoading } = useGetMyDues({ query: { queryKey: ["/api/dues/me"] } });

  const [videoPath, setVideoPath]   = useState("");
  const [photo1Path, setPhoto1Path] = useState("");
  const [photo2Path, setPhoto2Path] = useState("");

  const uploadMutation = useInductionUploadMember({
    mutation: {
      onSuccess: () => {
        toast({ title: "Pledge submitted!", description: "Your ceremony evidence is under review by the Village Head." });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setVideoPath(""); setPhoto1Path(""); setPhoto2Path("");
      },
      onError: (err: any) => {
        toast({ title: "Upload failed", description: err.response?.data?.error || "Unknown error", variant: "destructive" });
      },
    },
  });

  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  if (meLoading || duesLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!me) return null;

  const duesPaid = dues?.current?.paid ?? false;
  const currentStage = getPipelineStage(me, duesPaid);
  const currentIdx   = stageIndex(currentStage);

  const isVetted = (me as any).vettingStatus === "vetted";

  const canUpload =
    isVetted &&
    duesPaid &&
    me.inductionStatus === "not_started";

  const handleSubmit = () => {
    if (!videoPath || !photo1Path || !photo2Path) {
      toast({ title: "Missing files", description: "Please upload the pledge video and both ceremony photos.", variant: "destructive" });
      return;
    }
    uploadMutation.mutate({
      id: me.id,
      data: { inductionVideoPath: videoPath, inductionPhoto1Path: photo1Path, inductionPhoto2Path: photo2Path },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in-stagger">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Induction</h1>
        <p className="text-muted-foreground font-medium">Your pathway to Full Membership in Greater Bayelsa.</p>
      </div>

      {/* Pipeline Stepper */}
      <div className="bg-card border rounded-3xl p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Membership Pipeline</h2>
        <div className="space-y-3">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isComplete = idx < currentIdx || (currentStage === "inducted" && idx <= currentIdx);
            const isCurrent  = stage.key === currentStage;
            const isPending  = idx > currentIdx;

            return (
              <div key={stage.key} className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${
                isCurrent  ? "bg-primary/10 border border-primary/20" :
                isComplete ? "bg-emerald-50 border border-emerald-100" :
                             "bg-muted/30 border border-transparent"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isComplete ? "bg-emerald-500 text-white" :
                  isCurrent  ? "bg-primary text-white" :
                               "bg-muted text-muted-foreground"
                }`}>
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrent ? (
                    <stage.icon className="w-4 h-4" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${isCurrent ? "text-primary" : isComplete ? "text-emerald-700" : "text-muted-foreground"}`}>
                    {stage.label}
                  </p>
                </div>
                {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>}
                {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {isPending && <Clock className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* State-based content */}
      {me.inductionStatus === "inducted" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center">
          <Award className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-serif text-emerald-800 mb-2">You are a Full Member</h2>
          <p className="text-emerald-700 font-medium mb-2">
            Inducted {me.inductedAt ? format(new Date(me.inductedAt), "MMMM d, yyyy") : ""}
          </p>
          <p className="text-emerald-600 text-sm mb-6">Your digital membership ID card is available on your dashboard.</p>
          <Link href="/dashboard" className="inline-flex items-center text-emerald-700 font-bold hover:underline">
            View Dashboard & ID Card <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      )}

      {me.inductionStatus === "pledge_submitted" && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-serif text-amber-800 mb-2">Pledge Submitted — Awaiting Confirmation</h2>
          <p className="text-amber-700 font-medium">
            Your pledge video and ceremony photos have been submitted. The Village Head will review them and confirm your induction.
          </p>
        </div>
      )}

      {me.inductionStatus === "not_started" && !isVetted && (
        <div className="bg-muted/60 border border-border rounded-3xl p-8 text-center">
          <Lock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-serif mb-2">Vetting Required</h2>
          <p className="text-muted-foreground font-medium mb-6">
            Your membership application must be vetted by the Village Head before the induction process begins. You will be notified once vetting is complete.
          </p>
        </div>
      )}

      {me.inductionStatus === "not_started" && isVetted && !duesPaid && (
        <div className="bg-muted/60 border border-border rounded-3xl p-8 text-center">
          <Lock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-serif mb-2">Dues Required</h2>
          <p className="text-muted-foreground font-medium mb-6">
            You must pay your current membership dues before the induction upload becomes available.
          </p>
          <Link href="/dues" className="inline-flex items-center text-primary font-bold hover:underline">
            Go to Dues & Status <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      )}

      {canUpload && (
        <div className="bg-card border rounded-3xl p-8 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-bold font-serif mb-1">Submit Ceremony Evidence</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Upload your pledge video and two ceremony photos from your in-person induction. All three must be submitted together.
            </p>
          </div>

          {/* Pledge Video */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Video className="w-4 h-4 text-primary" />
              Pledge Video (~30 seconds)
              {videoPath && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
            </div>
            <p className="text-xs text-muted-foreground">Record yourself reading the membership pledge aloud at the ceremony venue.</p>
            <ObjectUploader
              maxFileSize={500 * 1024 * 1024}
              onGetUploadParameters={async (file) => {
                const res = await fetch(`${baseUrl}/api/storage/uploads/request-url`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "video/mp4", purpose: "induction_video" }),
                });
                if (!res.ok) throw new Error("Failed to get upload URL");
                const data = await res.json();
                return { method: "PUT" as const, url: data.uploadURL, headers: { "Content-Type": file.type || "video/mp4" }, objectPath: data.objectPath };
              }}
              onComplete={(result) => {
                const path = (result.successful?.[0]?.meta as any)?.objectPath;
                if (path) { setVideoPath(path); toast({ title: "Video uploaded ✓" }); }
              }}
              buttonClassName={`w-full py-4 rounded-2xl border-2 border-dashed font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                videoPath ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
              }`}
            >
              <Video className="w-4 h-4" />
              {videoPath ? "Video uploaded — click to replace" : "Click to upload pledge video"}
            </ObjectUploader>
          </div>

          {/* Photo 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ImageIcon className="w-4 h-4 text-violet-600" />
              Ceremony Photo 1
              {photo1Path && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
            </div>
            <ObjectUploader
              maxFileSize={50 * 1024 * 1024}
              onGetUploadParameters={async (file) => {
                const res = await fetch(`${baseUrl}/api/storage/uploads/request-url`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "image/jpeg", purpose: "induction_photo" }),
                });
                if (!res.ok) throw new Error("Failed to get upload URL");
                const data = await res.json();
                return { method: "PUT" as const, url: data.uploadURL, headers: { "Content-Type": file.type || "image/jpeg" }, objectPath: data.objectPath };
              }}
              onComplete={(result) => {
                const path = (result.successful?.[0]?.meta as any)?.objectPath;
                if (path) { setPhoto1Path(path); toast({ title: "Photo 1 uploaded ✓" }); }
              }}
              buttonClassName={`w-full py-4 rounded-2xl border-2 border-dashed font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                photo1Path ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              {photo1Path ? "Photo 1 uploaded — click to replace" : "Click to upload ceremony photo 1"}
            </ObjectUploader>
          </div>

          {/* Photo 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              Ceremony Photo 2
              {photo2Path && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
            </div>
            <ObjectUploader
              maxFileSize={50 * 1024 * 1024}
              onGetUploadParameters={async (file) => {
                const res = await fetch(`${baseUrl}/api/storage/uploads/request-url`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "image/jpeg", purpose: "induction_photo" }),
                });
                if (!res.ok) throw new Error("Failed to get upload URL");
                const data = await res.json();
                return { method: "PUT" as const, url: data.uploadURL, headers: { "Content-Type": file.type || "image/jpeg" }, objectPath: data.objectPath };
              }}
              onComplete={(result) => {
                const path = (result.successful?.[0]?.meta as any)?.objectPath;
                if (path) { setPhoto2Path(path); toast({ title: "Photo 2 uploaded ✓" }); }
              }}
              buttonClassName={`w-full py-4 rounded-2xl border-2 border-dashed font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                photo2Path ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              {photo2Path ? "Photo 2 uploaded — click to replace" : "Click to upload ceremony photo 2"}
            </ObjectUploader>
          </div>

          {/* Submit */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-3 mb-4 text-sm">
              <div className={`w-2 h-2 rounded-full ${videoPath ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
              <span className={videoPath ? "text-emerald-700 font-semibold" : "text-muted-foreground"}>Pledge video</span>
              <div className={`w-2 h-2 rounded-full ml-4 ${photo1Path ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
              <span className={photo1Path ? "text-emerald-700 font-semibold" : "text-muted-foreground"}>Photo 1</span>
              <div className={`w-2 h-2 rounded-full ml-4 ${photo2Path ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
              <span className={photo2Path ? "text-emerald-700 font-semibold" : "text-muted-foreground"}>Photo 2</span>
            </div>
            <Button
              className="w-full h-12 font-bold shadow-sm"
              disabled={!videoPath || !photo1Path || !photo2Path || uploadMutation.isPending}
              onClick={handleSubmit}
            >
              {uploadMutation.isPending ? "Submitting..." : "Submit All Evidence for Review"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3 font-medium">
              All three files must be uploaded before submission. This cannot be undone.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
