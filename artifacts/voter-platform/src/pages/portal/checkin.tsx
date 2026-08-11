import { useEffect, useRef, useState } from "react";
import {
  useAttendanceCheckin,
  getListMeetingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export function Checkin() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<
    | { status: "success"; message: string }
    | { status: "error"; message: string }
    | null
  >(null);
  const autoSubmitted = useRef(false);

  const checkinMutation = useAttendanceCheckin({
    mutation: {
      onSuccess: () => {
        setResult({
          status: "success",
          message: "Your attendance has been recorded. Thank you for showing up for your community.",
        });
        queryClient.invalidateQueries({ queryKey: getListMeetingsQueryKey() });
      },
      onError: (err: any) => {
        const status = err?.response?.status;
        const message =
          status === 409
            ? "You are already checked in for this meeting."
            : status === 404
              ? "That check-in code is not valid. Confirm the code with your village head."
              : err?.response?.data?.error ?? "Check-in failed. Please try again.";
        setResult({ status: status === 409 ? "success" : "error", message });
      },
    },
  });

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setResult(null);
    checkinMutation.mutate({ data: { code: trimmed } });
  };

  // Auto check-in when arriving from a scanned QR link (?code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrCode = params.get("code");
    if (qrCode && !autoSubmitted.current) {
      autoSubmitted.current = true;
      setCode(qrCode);
      submit(qrCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in-stagger pt-12">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-sm border border-primary/20">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold font-serif tracking-tight mb-4">Meeting Check-In</h1>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          Scan the QR code at your village meeting, or enter the check-in code below.
        </p>
      </div>

      <div className="bg-card rounded-3xl border shadow-sm p-8 max-w-md mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-accent" />

        {result ? (
          <div className="text-center space-y-6 py-4">
            {result.status === "success" ? (
              <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
            ) : (
              <AlertTriangle className="w-14 h-14 text-destructive mx-auto" />
            )}
            <p className="font-bold text-lg font-serif">{result.message}</p>
            <div className="flex flex-col gap-3">
              <Link href="/meetings" className="text-sm font-bold text-primary underline">
                View meeting records
              </Link>
              {result.status === "error" && (
                <Button variant="outline" onClick={() => setResult(null)} className="font-bold">
                  Try Again
                </Button>
              )}
            </div>
          </div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              submit(code);
            }}
          >
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block text-center">
                Enter Check-In Code
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                className="h-16 text-center text-2xl font-bold font-mono tracking-widest bg-muted/50 border-2 focus-visible:border-primary/50"
                placeholder="Enter code"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 font-bold text-lg shadow-sm"
              disabled={!code.trim() || checkinMutation.isPending}
            >
              {checkinMutation.isPending ? "Verifying..." : "Verify Attendance"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
