import { useGetMembersSummary, useGetStatsSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Activity, ShieldCheck, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Button, buttonVariants } from "@/components/ui/button";

export function AdminDashboard() {
  const { data: membersSummary, isLoading: loadingMembers } = useGetMembersSummary();
  const { data: votersSummary, isLoading: loadingVoters } = useGetStatsSummary();

  const isLoading = loadingMembers || loadingVoters;

  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-in-stagger pb-12">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">Platform statistics and management shortcuts.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-serif">Members</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Total Members</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{membersSummary?.totalMembers.toLocaleString() || 0}</div></CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><UserCheck className="h-4 w-4 text-emerald-500" /> Active</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{membersSummary?.activeMembers.toLocaleString() || 0}</div></CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Activity className="h-4 w-4 text-amber-500" /> Pending</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{membersSummary?.pendingMembers.toLocaleString() || 0}</div></CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-500" /> Coordinators</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{membersSummary?.coordinators.toLocaleString() || 0}</div></CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-serif">Voter Base</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Database</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{votersSummary?.totalVoters.toLocaleString() || 0}</div></CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Strong Support</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-emerald-600">{votersSummary?.strongSupporters.toLocaleString() || 0}</div></CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{votersSummary?.contacted.toLocaleString() || 0}</div></CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">LGAs Reached</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{votersSummary?.lgasCovered} / 8</div></CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Member Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Review pending members, assign coordinators, and manage roles.</p>
            <Link href="/admin/members" className={buttonVariants({ className: "w-full justify-start gap-2" })}><Users className="h-4 w-4" /> Manage Members</Link>
            <Link href="/admin/notifications" className={buttonVariants({ variant: "outline", className: "w-full justify-start gap-2" })}>Broadcast to Members</Link>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Publish news, job opportunities, and upcoming events.</p>
            <Link href="/admin/content" className={buttonVariants({ className: "w-full justify-start gap-2" })}><Activity className="h-4 w-4" /> Manage Content</Link>
            <Link href="/admin/voters" className={buttonVariants({ variant: "outline", className: "w-full justify-start gap-2" })}><MapPin className="h-4 w-4" /> Voter Database</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}