import { useState } from "react";
import { useGetMeeting, useGetMe, useListMembers, useAttendanceVideo, getGetMeetingQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, Calendar, MapPin, CheckCircle2, Video, FileVideo } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function MeetingDetail() {
  const [match, params] = useRoute("/meetings/:id");
  const id = !params?.id || params.id === "new" ? null : parseInt(params.id, 10);
  
  if (!id) {
    return <MeetingSubmitForm />;
  }

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe({ query: { queryKey: ["/api/me"] } });

  const { data: meeting, isLoading } = useGetMeeting(id, {
    query: { enabled: !!id, queryKey: ["/api/meetings", id] }
  });

  const isExec = me && ["village_head", "secretary", "treasurer", "assistant", "founder"].includes(me.role);

  const { data: members } = useListMembers(
    { villageId: meeting?.villageId },
    { query: { enabled: isExec && !!meeting?.villageId, queryKey: ["/api/members", { villageId: meeting?.villageId }] } }
  );

  const [attendanceUserId, setAttendanceUserId] = useState<string>("");
  const [videoObjectPath, setVideoObjectPath] = useState<string>("");

  const attendanceMutation = useAttendanceVideo({
    mutation: {
      onSuccess: () => {
        toast({ title: "Attendance recorded", description: "Video attendance verified successfully." });
        queryClient.invalidateQueries({ queryKey: getGetMeetingQueryKey(id) });
        setAttendanceUserId("");
        setVideoObjectPath("");
      },
      onError: (err: any) => {
        toast({ title: "Failed to record attendance", description: err.response?.data?.error || "Unknown error", variant: "destructive" });
      }
    }
  });

  const handleRecordAttendance = () => {
    if (!attendanceUserId || !videoObjectPath) return;
    attendanceMutation.mutate({
      data: {
        meetingId: id,
        userId: parseInt(attendanceUserId, 10),
        videoObjectPath
      }
    });
  };

  if (isLoading || !meeting) {
    return <div className="p-8"><Skeleton className="h-[60vh] w-full rounded-3xl" /></div>;
  }

  const photos = meeting.media.filter(m => m.kind === 'photo');
  const video = meeting.media.find(m => m.kind === 'video');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-stagger">
      <div>
        <Link href="/meetings" className="inline-flex items-center text-muted-foreground hover:text-foreground font-medium transition-colors mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Records
        </Link>
        <div className="bg-primary text-primary-foreground p-8 rounded-3xl shadow-sm border border-primary/20">
          <div className="flex items-center gap-2 text-primary-foreground/70 font-bold uppercase tracking-wider text-xs mb-3">
            <MapPin className="w-4 h-4" /> {meeting.villageName}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-4 tracking-tight">Monthly Institutional Meeting</h1>
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <div className="flex items-center bg-background/10 rounded-lg px-3 py-1.5 border border-background/10">
              <Calendar className="w-4 h-4 mr-2" /> {format(new Date(meeting.heldOn), 'MMMM d, yyyy')}
            </div>
            <div className="flex items-center bg-background/10 rounded-lg px-3 py-1.5 border border-background/10">
              <Users className="w-4 h-4 mr-2" /> {meeting.attendanceCount} Members Attended
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-card rounded-3xl border shadow-sm p-8">
            <h2 className="text-xl font-bold font-serif mb-4">Discussion Points</h2>
            <div className="prose prose-sm md:prose-base max-w-none text-foreground/80">
              {meeting.discussionPoints.split('\n').map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
          
          {photos.length > 0 && (
            <div>
              <h3 className="text-lg font-bold font-serif mb-4">Photographic Record</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map(p => (
                  <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-muted border shadow-sm">
                    <img 
                      src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${p.objectPath}`}
                      alt="Meeting record"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {video && (
            <div className="bg-card rounded-3xl border shadow-sm p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider text-primary">
                <Video className="w-4 h-4" /> Video Record
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-sm relative group cursor-pointer">
                <video 
                  src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${video.objectPath}`}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center font-medium">Unedited contiguous record (≥ 2 mins)</p>
            </div>
          )}
          
          {meeting.checkinCode && (
            <div className="bg-card rounded-3xl border shadow-sm p-6 text-center">
              <h3 className="font-bold font-serif mb-4">QR Self Check-in</h3>
              <div className="inline-block bg-white p-4 rounded-2xl border">
                <QRCodeSVG
                  value={`${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/checkin?code=${meeting.checkinCode}`}
                  size={168}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-medium">
                Members scan this at the meeting to check themselves in.
              </p>
              <p className="text-xs font-bold mt-1 tracking-widest uppercase text-muted-foreground">
                Code: {meeting.checkinCode}
              </p>
            </div>
          )}

          {isExec && (
            <div className="bg-card rounded-3xl border shadow-sm p-6">
              <h3 className="font-bold font-serif mb-4 flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-primary" /> Record Video Attendance
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Select Member</Label>
                  <Select value={attendanceUserId} onValueChange={setAttendanceUserId}>
                    <SelectTrigger className="h-10 bg-muted/50">
                      <SelectValue placeholder="Select member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {members?.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Upload Attendance Video</Label>
                  <div className="flex gap-2">
                    <ObjectUploader
                      maxFileSize={2 * 1024 * 1024 * 1024}
                      onGetUploadParameters={async (file) => {
                        const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage/uploads/request-url`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || 'video/mp4', purpose: 'attendance_video' }),
                        });
                        if (!res.ok) throw new Error("Failed to get URL");
                        const data = await res.json();
                        return { method: 'PUT' as const, url: data.uploadURL, headers: { 'Content-Type': file.type || 'video/mp4' }, objectPath: data.objectPath };
                      }}
                      onComplete={(result) => {
                        const objectPath = (result.successful?.[0]?.meta as any)?.objectPath;
                        if (objectPath) {
                          setVideoObjectPath(objectPath);
                          toast({ title: "Video uploaded successfully" });
                        }
                      }}
                      buttonClassName="flex-1 text-center bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 rounded-lg font-bold text-xs cursor-pointer border border-primary/20"
                    >
                      {videoObjectPath ? "Replace Video" : "Upload Short Video"}
                    </ObjectUploader>
                  </div>
                </div>

                <Button 
                  onClick={handleRecordAttendance}
                  disabled={!attendanceUserId || !videoObjectPath || attendanceMutation.isPending}
                  className="w-full font-bold shadow-sm"
                >
                  {attendanceMutation.isPending ? "Recording..." : "Verify Attendance"}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-bold font-serif mb-4">Attendance Verification</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-sm font-medium text-muted-foreground">Self Check-in</span>
                <span className="font-bold">{meeting.attendance.filter(a => a.method === 'qr').length}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-sm font-medium text-muted-foreground">Video Verified</span>
                <span className="font-bold">{meeting.attendance.filter(a => a.method === 'video').length}</span>
              </div>
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs font-bold leading-tight">Attendance digitally verified against institutional roll.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingSubmitForm() {
  return (
    <div className="max-w-3xl mx-auto py-12 text-center text-muted-foreground">
      <p className="font-medium">Form logic to be wired...</p>
    </div>
  );
}
