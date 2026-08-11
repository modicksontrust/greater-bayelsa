import { useState, useMemo } from "react";
import { useGetMyDues, useGetMe, useGetDuesStatus, useGetDuesRollup, useRecordBulkDues, useListVillages, useListVillageUnits } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ShieldCheck, XCircle, DollarSign, Calendar, TrendingUp, Filter } from "lucide-react";
import { format, subMonths, subMonths as subM } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function Dues() {
  const { data: me, isLoading: meLoading } = useGetMe({ query: { queryKey: ["/api/me"] } });
  
  if (meLoading || !me) {
    return <div className="p-8"><Skeleton className="h-64 w-full rounded-3xl" /></div>;
  }

  const isLeader = ["founder", "assistant", "village_head", "secretary", "treasurer", "unit_leader"].includes(me.role);
  const isHQ = me.role === "founder" || me.role === "assistant";
  const canRecordCash = ["founder", "assistant", "treasurer"].includes(me.role);

  return (
    <div className="space-y-8 animate-in-stagger">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Institutional Dues</h1>
        <p className="text-muted-foreground font-medium">Symbolic contributions (₦100/month) demonstrating commitment to the organization.</p>
      </div>

      <MyDuesView />
      
      {isLeader && <LeaderDuesView isHQ={isHQ} villageId={me.villageId} canRecordCash={canRecordCash} />}
    </div>
  );
}

function MyDuesView() {
  const { data: dues, isLoading } = useGetMyDues({ query: { queryKey: ["/api/dues/me"] } });

  if (isLoading || !dues) {
    return <Skeleton className="h-48 w-full rounded-3xl" />;
  }

  return (
    <div className="bg-card rounded-3xl border shadow-sm p-8 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-64 h-full bg-primary/5 -skew-x-12 translate-x-8" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-lg font-bold font-serif mb-1">My Status</h2>
          <div className="flex items-center gap-3">
            {dues.current.paid ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 px-3 py-1 font-bold">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Good Standing
              </Badge>
            ) : (
              <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10 border-0 px-3 py-1 font-bold">
                <XCircle className="w-4 h-4 mr-1.5" /> Payment Due
              </Badge>
            )}
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {format(new Date(dues.current.period + '-01'), 'MMMM yyyy')}
            </span>
          </div>
        </div>

        <div className="bg-muted/50 border rounded-2xl p-4 flex-shrink-0 text-center w-full md:w-auto">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Digital Payment</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-muted-foreground opacity-50" />
            <span className="text-xl font-bold text-muted-foreground opacity-50 line-through">Pay Online</span>
          </div>
          <p className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded px-2 py-1">COMING SOON</p>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium">Please hand cash to your Unit Leader.</p>
        </div>
      </div>

      {dues.payments.length > 0 && (
        <div className="mt-8 border-t pt-8 relative z-10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Payment History</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dues.payments.slice(0, 3).map(p => (
              <div key={p.id} className="bg-background border rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{format(new Date(p.period + '-01'), 'MMM yyyy')}</p>
                  <p className="text-xs text-muted-foreground">₦{p.amountKobo / 100}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderDuesView({ isHQ, villageId, canRecordCash }: { isHQ: boolean, villageId?: number | null, canRecordCash: boolean }) {
  const currentPeriod = format(new Date(), 'yyyy-MM');
  const [period, setPeriod] = useState(currentPeriod);
  
  const { data: villages } = useListVillages({ query: { queryKey: ["/api/villages"] } });
  const [filterVillage, setFilterVillage] = useState<string>(isHQ ? "all" : (villageId?.toString() || ""));
  
  const { data: statusList, isLoading } = useGetDuesStatus({
    period,
    villageId: filterVillage !== "all" && filterVillage ? parseInt(filterVillage, 10) : undefined
  } as any, {
    query: {
      queryKey: ["/api/dues/status", period, filterVillage]
    }
  });

  const periods = useMemo(() => {
    const p = [];
    for (let i = 0; i < 6; i++) {
      p.push(format(subM(new Date(), i), 'yyyy-MM'));
    }
    return p;
  }, []);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recording, setRecording] = useState<{ userId: number; name: string } | null>(null);
  const [posReference, setPosReference] = useState("");

  const bulkDuesMutation = useRecordBulkDues({
    mutation: {
      onSuccess: (result: any) => {
        toast({
          title: "Cash payment recorded",
          description: `Recorded ${result?.recorded ?? 1} payment(s) for ${format(new Date(period + '-01'), 'MMMM yyyy')}.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dues/status", period, filterVillage] });
        setRecording(null);
        setPosReference("");
      },
      onError: (err: any) => {
        toast({
          title: "Could not record payment",
          description: err?.response?.data?.error ?? "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  return (
    <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 border-b bg-muted/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold font-serif flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" /> Collection Status
          </h2>
          
          <div className="flex gap-4 w-full md:w-auto">
            {isHQ && (
              <Select value={filterVillage} onValueChange={setFilterVillage}>
                <SelectTrigger className="w-full md:w-[200px] h-10 bg-white font-semibold">
                  <SelectValue placeholder="All Villages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Villages</SelectItem>
                  {villages?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full md:w-[150px] h-10 bg-white font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map(p => (
                  <SelectItem key={p} value={p}>{format(new Date(p + '-01'), 'MMMM yyyy')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 text-muted-foreground font-bold text-xs uppercase tracking-wider border-b">
            <tr>
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {isLoading ? (
              [1,2,3].map(i => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-48" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-24 mx-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                </tr>
              ))
            ) : statusList?.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground font-medium">
                  No members found for this criteria.
                </td>
              </tr>
            ) : (
              statusList?.map(s => (
                <tr key={s.userId} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{s.firstName} {s.lastName}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{s.membershipCode}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {s.paid ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">
                        <XCircle className="w-3 h-3 mr-1" /> Unpaid
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!s.paid && canRecordCash && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-bold text-xs h-8"
                        onClick={() => setRecording({ userId: s.userId, name: `${s.firstName} ${s.lastName}` })}
                      >
                        Record Cash
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!recording} onOpenChange={(open) => { if (!open) { setRecording(null); setPosReference(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Record Cash Payment</DialogTitle>
            <DialogDescription>
              Record a ₦100 cash dues payment for {recording?.name} — {format(new Date(period + '-01'), 'MMMM yyyy')}. Enter the POS deposit reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="posRef">POS Reference <span className="text-destructive">*</span></Label>
            <Input
              id="posRef"
              value={posReference}
              onChange={(e) => setPosReference(e.target.value)}
              placeholder="e.g. POS-2026-08-0042"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRecording(null); setPosReference(""); }} className="font-bold">
              Cancel
            </Button>
            <Button
              className="font-bold"
              disabled={!posReference.trim() || bulkDuesMutation.isPending}
              onClick={() => {
                if (!recording) return;
                bulkDuesMutation.mutate({
                  data: { userIds: [recording.userId], period, reference: posReference.trim() },
                });
              }}
            >
              {bulkDuesMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
