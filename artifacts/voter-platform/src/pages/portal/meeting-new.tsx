import { useState } from "react";
import { useLocation } from "wouter";
import {
  useSubmitMeeting,
  useGetMe,
  useListVillages,
  getListMeetingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Video, CheckCircle2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

// Fixed six-segment monthly agenda (identical every month)
const AGENDA_SEGMENTS = [
  { key: "opening", label: "1. Opening", hint: "Welcome and attendance" },
  { key: "wellbeing", label: "2. Wellbeing / Welfare Check", hint: "Support needs, bereavement, urgent concerns" },
  { key: "updates", label: "3. Updates & Reporting", hint: "Local, community, and security matters" },
  { key: "openFloor", label: "4. Open Floor", hint: "Member concerns and requests (feeds the HQ request below)" },
  { key: "dues", label: "5. Dues Confirmation & Administrative Matters", hint: "Dues status and administration" },
  { key: "closing", label: "6. Closing Remarks", hint: "Next meeting reminder" },
] as const;

async function getUploadParameters(file: { name: string; size: number; type: string; purpose?: string }) {
  const res = await fetch(`${API_BASE}/storage/uploads/request-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type, purpose: file.purpose }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  const data = await res.json();
  // objectPath is returned here and stored in Uppy file meta by ObjectUploader
  // so it is available in onComplete as file.meta.objectPath (GCS PUT body is empty).
  return { method: "PUT" as const, url: data.uploadURL as string, headers: { "Content-Type": file.type }, objectPath: data.objectPath as string };
}

function extractVideoDuration(objectPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => resolve(Math.floor(el.duration));
    el.onerror = () => reject(new Error("Could not read video metadata"));
    el.src = `${API_BASE}/storage${objectPath}`;
  });
}

export function MeetingNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe({ query: { queryKey: ["/api/me"] } });

  const isHQ = me?.role === "founder" || me?.role === "assistant";
  const { data: villages } = useListVillages(
    { query: { queryKey: ["/api/villages"] } },
  );

  const [heldOn, setHeldOn] = useState("");
  const [attendanceCount, setAttendanceCount] = useState("");
  const [targetVillageId, setTargetVillageId] = useState<string>("");
  const [segments, setSegments] = useState<Record<string, string>>({});
  const [hqRequest, setHqRequest] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<{ objectPath: string; durationSeconds: number } | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const submitMutation = useSubmitMeeting({
    mutation: {
      onSuccess: (meeting) => {
        queryClient.invalidateQueries({ queryKey: getListMeetingsQueryKey() });
        toast({ title: "Meeting record submitted", description: "The QR check-in code is on the record page." });
        setLocation(`/meetings/${meeting.id}`);
      },
      onError: (err: any) => {
        toast({
          title: "Submission failed",
          description: err?.response?.data?.error ?? "Please review the form and try again.",
          variant: "destructive",
        });
      },
    },
  });

  if (
    me &&
    me.role !== "village_head" &&
    me.role !== "secretary" &&
    me.role !== "assistant" &&
    me.role !== "founder"
  ) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <h2 className="text-2xl font-bold font-serif mb-3">Village Executive Access Only</h2>
        <p className="text-muted-foreground">Monthly meeting records are submitted by the village head or secretary.</p>
      </div>
    );
  }

  // HQ must choose a target village; non-HQ use their own village automatically.
  const hqVillageReady = !isHQ || Boolean(targetVillageId);

  // All six segments must have content before the form can be submitted.
  const allSegmentsFilled = AGENDA_SEGMENTS.every((s) => (segments[s.key] ?? "").trim().length > 0);

  const canSubmit =
    heldOn &&
    Number(attendanceCount) >= 0 &&
    attendanceCount !== "" &&
    hqVillageReady &&
    allSegmentsFilled &&
    photos.length >= 5 &&
    video &&
    video.durationSeconds >= 120 &&
    !submitMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !video) return;
    submitMutation.mutate({
      data: {
        heldOn,
        attendanceCount: Number(attendanceCount),
        agenda: {
          opening: segments.opening ?? "",
          wellbeing: segments.wellbeing ?? "",
          updates: segments.updates ?? "",
          openFloor: segments.openFloor ?? "",
          dues: segments.dues ?? "",
          closing: segments.closing ?? "",
        },
        hqRequest: hqRequest.trim() || null,
        photos,
        video,
        targetVillageId: isHQ && targetVillageId ? Number(targetVillageId) : null,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in-stagger">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Submit Monthly Meeting Record</h1>
        <p className="text-muted-foreground font-medium">
          Follow the fixed six-segment agenda. A record requires at least five photos and a video of two minutes or longer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-3xl border shadow-sm p-8 space-y-6">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block">Meeting Details</Label>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="heldOn">Date Held <span className="text-destructive">*</span></Label>
              <Input id="heldOn" type="date" value={heldOn} onChange={(e) => setHeldOn(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendance">Attendance Count <span className="text-destructive">*</span></Label>
              <Input
                id="attendance"
                type="number"
                min={0}
                value={attendanceCount}
                onChange={(e) => setAttendanceCount(e.target.value)}
                required
              />
            </div>
          </div>

          {isHQ && (
            <div className="space-y-2">
              <Label htmlFor="targetVillage">Village <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground font-medium">
                HQ is submitting this record on behalf of a village.
              </p>
              <Select value={targetVillageId} onValueChange={setTargetVillageId} required>
                <SelectTrigger id="targetVillage" className="h-11">
                  <SelectValue placeholder="Select a village" />
                </SelectTrigger>
                <SelectContent>
                  {villages?.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="bg-card rounded-3xl border shadow-sm p-8 space-y-6">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block">Agenda — Six Fixed Segments</Label>
          {AGENDA_SEGMENTS.map((s) => (
            <div key={s.key} className="space-y-2">
              <Label htmlFor={s.key} className="font-bold">{s.label}</Label>
              <p className="text-xs text-muted-foreground font-medium">{s.hint}</p>
              <Textarea
                id={s.key}
                rows={2}
                value={segments[s.key] ?? ""}
                onChange={(e) => setSegments((prev) => ({ ...prev, [s.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="hqRequest" className="font-bold">Request to Headquarters (optional)</Label>
            <p className="text-xs text-muted-foreground font-medium">
              Distinct from discussion notes — HQ tracks and responds to this separately.
            </p>
            <Textarea id="hqRequest" rows={3} value={hqRequest} onChange={(e) => setHqRequest(e.target.value)} />
          </div>
        </div>

        <div className="bg-card rounded-3xl border shadow-sm p-8 space-y-6">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block">
            Evidence — {photos.length}/5 photos minimum, video {video ? `${Math.floor(video.durationSeconds / 60)}m${video.durationSeconds % 60}s` : "required (2+ minutes)"}
          </Label>

          <div className="flex flex-wrap gap-3">
            {photos.map((p) => (
              <div key={p} className="relative w-24 h-24">
                <img src={`${API_BASE}/storage${p}`} className="w-full h-full object-cover rounded-xl border" />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((x) => x !== p))}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <ObjectUploader
              onGetUploadParameters={(file) => getUploadParameters({ name: file.name, size: file.size ?? 0, type: file.type ?? "image/jpeg", purpose: "meeting_photo" })}
              onComplete={(result) => {
                const paths = (result.successful ?? [])
                  .map((f) => (f.meta as any)?.objectPath)
                  .filter(Boolean) as string[];
                if (paths.length) setPhotos((prev) => [...prev, ...paths]);
              }}
              buttonClassName="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
            >
              <Camera className="w-6 h-6 mb-1 opacity-60" />
              <span className="text-[10px] font-bold uppercase">Add Photos</span>
            </ObjectUploader>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            {video ? (
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <CheckCircle2 className="w-5 h-5" /> Video uploaded ({video.durationSeconds}s)
                <button type="button" onClick={() => setVideo(null)} className="text-muted-foreground underline font-medium ml-2">
                  Replace
                </button>
              </div>
            ) : (
              <ObjectUploader
                maxFileSize={2 * 1024 * 1024 * 1024}
                onGetUploadParameters={(file) => getUploadParameters({ name: file.name, size: file.size ?? 0, type: file.type ?? "video/mp4", purpose: "meeting_video" })}
                onComplete={async (result) => {
                  const objectPath = (result.successful?.[0]?.meta as any)?.objectPath;
                  if (!objectPath) return;
                  setVideoError(null);
                  try {
                    const durationSeconds = await extractVideoDuration(objectPath);
                    if (durationSeconds < 120) {
                      setVideoError(`Video is ${durationSeconds}s — it must be at least 2 minutes (120s).`);
                      return;
                    }
                    setVideo({ objectPath, durationSeconds });
                  } catch {
                    setVideoError("Could not read the video duration. Try a different file format (MP4 recommended).");
                  }
                }}
                buttonClassName="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground hover:border-primary/50 transition-colors font-bold text-sm"
              >
                <Video className="w-5 h-5 opacity-60" /> Upload Meeting Video (2+ min)
              </ObjectUploader>
            )}
          </div>
          {videoError && <p className="text-sm font-bold text-destructive">{videoError}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full font-bold" disabled={!canSubmit}>
          {submitMutation.isPending ? "Submitting..." : "Submit Meeting Record"}
        </Button>
      </form>
    </div>
  );
}
