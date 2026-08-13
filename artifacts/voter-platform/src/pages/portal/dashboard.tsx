import { useGetMe, useGetOverviewStats, useListUpdates, useListEvents, useListMemberBirthdays, useGetMyDues } from "@workspace/api-client-react";
import {
  Users, AlertCircle, FileText, Bell, CheckCircle2, Activity, Calendar,
  UserCircle, ShieldCheck, GraduationCap, MessageSquare, ClipboardList,
  UserPlus, CheckSquare, Database, Send, ChevronRight, Cake, Award,
  Lock, Download, Star, Upload, CreditCard, UserCheck, Building2,
  TrendingUp, Inbox, MapPin, Layers, Zap,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";

// ─── Pipeline (members only) ──────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "enrolled",  label: "Enrolled",              icon: UserCheck,  color: "bg-blue-500"    },
  { key: "vetted",    label: "Vetted",                icon: ShieldCheck,color: "bg-indigo-500"  },
  { key: "dues",      label: "Dues Paid",             icon: CreditCard, color: "bg-violet-500"  },
  { key: "pledge",    label: "Pledge Submitted",      icon: Upload,     color: "bg-amber-500"   },
  { key: "confirmed", label: "VH Confirmed",          icon: Star,       color: "bg-orange-500"  },
  { key: "inducted",  label: "Full Member",           icon: Award,      color: "bg-emerald-500" },
];

function getPipelineIdx(member: any, duesPaid: boolean) {
  if (member.inductionStatus === "inducted") return 5;
  if (member.inductionStatus === "pledge_submitted") return 3;
  if (duesPaid) return 2;
  if (member.vettingStatus === "vetted") return 1;
  return 0;
}

// ─── Digital ID Card ──────────────────────────────────────────────────────────

function MemberIdCard({ member }: { member: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `GB-ID-${member.membershipCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) { console.error("ID card download failed", e); }
  }, [member]);

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl"
        style={{ background: "linear-gradient(135deg, #1a4731 0%, #2d7a50 50%, #1a4731 100%)", fontFamily: "system-ui, sans-serif" }}
      >
        <div className="px-6 pt-5 pb-3 flex items-center gap-3 border-b border-white/15">
          <img src={`${baseUrl}/logo.svg`} alt="" className="w-10 h-10 rounded object-contain bg-white/10 p-1" />
          <div>
            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Greater Bayelsa</p>
            <p className="text-xs text-white/70 font-medium">Membership Identification</p>
          </div>
          <span className="ml-auto text-[10px] font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700/50">
            FULL MEMBER
          </span>
        </div>
        <div className="px-6 py-5 flex gap-4">
          {member.photoUrl ? (
            <img src={`${baseUrl}/api/storage${member.photoUrl}`} alt="Member"
              className="w-20 h-24 rounded-xl object-cover border-2 border-white/20 shrink-0" crossOrigin="anonymous" />
          ) : (
            <div className="w-20 h-24 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-bold text-white shrink-0 border-2 border-white/20">
              {member.firstName[0]}{member.lastName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight font-serif mb-1">{member.firstName} {member.lastName}</p>
            <p className="text-emerald-300 text-xs font-bold uppercase tracking-wide mb-3">{member.role.replace(/_/g, " ")}</p>
            <div className="space-y-1.5 text-xs text-white/80 font-medium">
              {member.villageName && <p>📍 {member.villageName}{member.unitName ? ` · ${member.unitName}` : ""}</p>}
              <p>📅 Inducted: {member.inductedAt ? format(new Date(member.inductedAt), "MMM d, yyyy") : "—"}</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex items-center justify-between">
          <div className="font-mono text-sm font-bold text-white/90 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
            {member.membershipCode}
          </div>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1.5 rounded-sm bg-emerald-400/40" style={{ height: `${8 + (i % 3) * 6}px` }} />
            ))}
          </div>
          <p className="text-[9px] text-white/40 font-medium">SAGBAMA CONSTITUENCY ONE</p>
        </div>
      </div>
      <Button onClick={downloadCard} variant="outline" className="w-full max-w-sm mx-auto flex font-bold h-10">
        <Download className="w-4 h-4 mr-2" /> Download ID Card
      </Button>
    </div>
  );
}

// ─── Quick-section data ───────────────────────────────────────────────────────

const MEMBER_SECTIONS = [
  { name: "My Profile",        path: "/profile",        icon: UserCircle,    color: "text-blue-600",   bg: "bg-blue-50"   },
  { name: "Dues & Status",     path: "/dues",           icon: ShieldCheck,   color: "text-emerald-600",bg: "bg-emerald-50"},
  { name: "Induction",         path: "/induction",      icon: Award,         color: "text-amber-600",  bg: "bg-amber-50"  },
  { name: "Training",          path: "/training",       icon: GraduationCap, color: "text-violet-600", bg: "bg-violet-50" },
  { name: "Meetings",          path: "/meetings",       icon: Users,         color: "text-primary",    bg: "bg-primary/5" },
  { name: "Calendar",          path: "/calendar",       icon: Calendar,      color: "text-amber-600",  bg: "bg-amber-50"  },
  { name: "Updates",           path: "/updates",        icon: Bell,          color: "text-rose-600",   bg: "bg-rose-50"   },
  { name: "Feedback",          path: "/feedback",       icon: MessageSquare, color: "text-sky-600",    bg: "bg-sky-50"    },
  { name: "Notifications",     path: "/notifications",  icon: ClipboardList, color: "text-slate-600",  bg: "bg-slate-50"  },
];

const LEADER_MGMT_SECTIONS = [
  { name: "Member Directory",  path: "/members",        icon: Users,         color: "text-indigo-600", bg: "bg-indigo-50" },
  { name: "Enroll Member",     path: "/enroll",         icon: UserPlus,      color: "text-teal-600",   bg: "bg-teal-50"   },
  { name: "Meetings",          path: "/meetings",       icon: Building2,     color: "text-primary",    bg: "bg-primary/5" },
  { name: "Calendar",          path: "/calendar",       icon: Calendar,      color: "text-amber-600",  bg: "bg-amber-50"  },
  { name: "Updates",           path: "/updates",        icon: Bell,          color: "text-rose-600",   bg: "bg-rose-50"   },
  { name: "Training",          path: "/training",       icon: GraduationCap, color: "text-violet-600", bg: "bg-violet-50" },
  { name: "Notifications",     path: "/notifications",  icon: ClipboardList, color: "text-slate-600",  bg: "bg-slate-50"  },
  { name: "My Profile",        path: "/profile",        icon: UserCircle,    color: "text-blue-600",   bg: "bg-blue-50"   },
];

const HQ_MGMT_SECTIONS = [
  { name: "Member Directory",  path: "/members",        icon: Users,         color: "text-indigo-600", bg: "bg-indigo-50" },
  { name: "Enroll Member",     path: "/enroll",         icon: UserPlus,      color: "text-teal-600",   bg: "bg-teal-50"   },
  { name: "HQ Requests",       path: "/admin/requests", icon: Inbox,         color: "text-orange-600", bg: "bg-orange-50" },
  { name: "Voter Roll",        path: "/admin/voters",   icon: Database,      color: "text-cyan-600",   bg: "bg-cyan-50"   },
  { name: "Manage Content",    path: "/admin/content",  icon: FileText,      color: "text-lime-700",   bg: "bg-lime-50"   },
  { name: "Bulk Messaging",    path: "/admin/messaging",icon: Send,          color: "text-pink-600",   bg: "bg-pink-50"   },
  { name: "Meetings",          path: "/meetings",       icon: Building2,     color: "text-primary",    bg: "bg-primary/5" },
  { name: "Calendar",          path: "/calendar",       icon: Calendar,      color: "text-amber-600",  bg: "bg-amber-50"  },
  { name: "Updates",           path: "/updates",        icon: Bell,          color: "text-rose-600",   bg: "bg-rose-50"   },
  { name: "Notifications",     path: "/notifications",  icon: ClipboardList, color: "text-slate-600",  bg: "bg-slate-50"  },
];

// ─── Shared sub-components ───────────────────────────────────────────────────

function BirthdayPanel({ birthdays, loading, baseUrl }: { birthdays: any[], loading: boolean, baseUrl: string }) {
  return (
    <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
      <div className="px-8 py-5 border-b bg-muted/20 flex items-center justify-between">
        <h2 className="text-xl font-bold font-serif flex items-center gap-2">
          <Cake className="w-5 h-5 text-pink-500" /> Upcoming Birthdays
          <span className="ml-2 text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider">Next 30 days</span>
        </h2>
      </div>
      {loading ? (
        <div className="p-8 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : !birthdays.length ? (
        <div className="p-12 text-center text-muted-foreground">
          <Cake className="h-8 w-8 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-sm">No birthdays in the next 30 days.</p>
        </div>
      ) : (
        <div className="divide-y">
          {birthdays.map(b => {
            const dob = new Date(b.dateOfBirth);
            const isToday = b.daysUntil === 0;
            const isSoon  = b.daysUntil <= 3;
            return (
              <div key={b.id} className={`px-8 py-4 flex items-center gap-4 ${isToday ? 'bg-pink-50/60' : ''}`}>
                {b.photoUrl ? (
                  <img src={`${baseUrl}/api/storage${b.photoUrl}`} className="w-10 h-10 rounded-xl object-cover border shrink-0" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {b.firstName[0]}{b.lastName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {b.firstName} {b.lastName}
                    {isToday && <span className="ml-2 text-pink-600">🎂 Today!</span>}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {b.villageName || 'HQ'}{b.unitName ? ` · ${b.unitName}` : ''} • {format(dob, 'MMMM d')}
                  </p>
                </div>
                <div className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  isToday ? 'bg-pink-100 text-pink-700' : isSoon ? 'bg-amber-50 text-amber-700' : 'bg-muted text-muted-foreground'
                }`}>
                  {isToday ? 'Today' : `${b.daysUntil}d`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UpdatesEventsPanel({ updates, events, updatesLoading, eventsLoading, baseUrl }: any) {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-bold font-serif">Community Updates</h2>
          <Link href="/updates" className="text-sm font-bold text-primary hover:underline">View All</Link>
        </div>
        {updatesLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-4">
            {updates.length > 0 ? updates.map((update: any) => (
              <Link key={update.id} href="/updates" className="block bg-card rounded-2xl border p-6 hover:border-primary/30 transition-colors shadow-sm relative overflow-hidden group">
                {update.urgent && <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {update.urgent && (
                      <span className="bg-destructive/10 text-destructive text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" /> Urgent
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{update.villageName || "HQ"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{format(new Date(update.createdAt), 'MMM d, h:mm a')}</span>
                </div>
                <h3 className="text-lg font-bold font-serif mb-2 group-hover:text-primary transition-colors">{update.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2">{update.body}</p>
              </Link>
            )) : (
              <div className="bg-card border border-dashed rounded-2xl p-12 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No recent updates.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-bold font-serif">Upcoming Events</h2>
          <Link href="/calendar" className="text-sm font-bold text-primary hover:underline">Calendar</Link>
        </div>
        {eventsLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
        ) : (
          <div className="bg-card rounded-3xl border shadow-sm overflow-hidden divide-y">
            {events.length > 0 ? events.map((event: any) => (
              <div key={event.id} className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 bg-primary/5 rounded-xl border border-primary/10 text-primary">
                    <span className="text-xs font-bold uppercase">{format(new Date(event.startsAt), 'MMM')}</span>
                    <span className="text-lg font-bold font-serif leading-none">{format(new Date(event.startsAt), 'd')}</span>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{event.title}</h3>
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                      <span className="bg-muted px-2 py-0.5 rounded uppercase tracking-wider text-[9px]">{event.scope}</span>
                      <span>{format(new Date(event.startsAt), 'h:mm a')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-sm">No scheduled events.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickGrid({ sections }: { sections: typeof MEMBER_SECTIONS }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {sections.map((section) => (
        <Link key={section.path} href={section.path}>
          <div className="group bg-card border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
            <div className={`${section.bg} ${section.color} rounded-xl p-2.5 shrink-0`}>
              <section.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-foreground leading-tight">{section.name}</p>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  const { data: member, isLoading: memberLoading } = useGetMe({ query: { queryKey: ["/api/me"] } });
  const { data: stats, isLoading: statsLoading } = useGetOverviewStats({ query: { queryKey: ["/api/overview-stats"] } });
  const { data: updates, isLoading: updatesLoading } = useListUpdates({ query: { queryKey: ["/api/community-updates"] } });
  const { data: events, isLoading: eventsLoading } = useListEvents({ query: { queryKey: ["/api/events"] } });
  const { data: birthdays, isLoading: birthdaysLoading } = useListMemberBirthdays(
    { days: 30 }, { query: { enabled: true, queryKey: ["/api/members/birthdays"] } }
  );
  const { data: dues } = useGetMyDues({ query: { queryKey: ["/api/dues/me"] } });

  if (memberLoading || !member) {
    return (
      <div className="space-y-8 animate-in-stagger">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>
      </div>
    );
  }

  const isHQ     = member.role === "founder" || member.role === "assistant";
  const isLeader = ["founder", "assistant", "village_head", "unit_leader", "secretary", "treasurer"].includes(member.role);
  const duesPaid    = dues?.current?.paid ?? false;
  const pipelineIdx = getPipelineIdx(member as any, duesPaid);
  const isInducted  = (member as any).inductionStatus === "inducted";

  const recentUpdates  = updates?.slice(0, 5) || [];
  const upcomingEvents = events?.slice(0, 3) || [];
  const allBirthdays   = birthdays || [];

  // ── HQ / Founder Command Centre ────────────────────────────────────────────
  if (isHQ) {
    const pendingRequests = stats?.pendingHqRequests ?? 0;
    const openFeedback    = stats?.openFeedback ?? 0;
    return (
      <div className="space-y-8 animate-in-stagger">

        {/* Command Centre Banner */}
        <div className="relative overflow-hidden rounded-3xl shadow-lg"
          style={{ background: "linear-gradient(135deg, #0f2d1f 0%, #1a4731 60%, #0f2d1f 100%)" }}>
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "16px 16px" }} />
          <div className="relative z-10 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-700/50">
                  Headquarters · {member.role === "founder" ? "Founder" : "My Assistant"}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-serif text-white mb-1 tracking-tight">
                {member.firstName} {member.lastName}
              </h1>
              <p className="text-emerald-300/80 font-medium">Greater Bayelsa — Sagbama Constituency One</p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              {pendingRequests > 0 && (
                <Link href="/admin/requests">
                  <div className="bg-amber-500/20 border border-amber-500/40 rounded-2xl px-5 py-3 flex items-center gap-3 hover:bg-amber-500/30 transition-colors cursor-pointer">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-amber-300 font-bold text-xl leading-none">{pendingRequests}</p>
                      <p className="text-amber-400/70 text-xs font-medium mt-0.5">Pending Requests</p>
                    </div>
                  </div>
                </Link>
              )}
              {openFeedback > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
                  <p className="text-white font-bold text-xl leading-none">{openFeedback}</p>
                  <p className="text-white/50 text-xs font-medium mt-0.5">Open Feedback</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Org-wide Stats */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Organisation Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-2xl p-6 border shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <Users className="h-4 w-4" />
                <h3 className="font-bold text-xs uppercase tracking-wide">Total Members</h3>
              </div>
              <p className="text-4xl font-bold font-serif">{statsLoading ? "—" : stats?.totalMembers}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Across all villages</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-emerald-600">
                <Activity className="h-4 w-4" />
                <h3 className="font-bold text-xs uppercase tracking-wide text-foreground">Active</h3>
              </div>
              <p className="text-4xl font-bold font-serif text-emerald-700">{statsLoading ? "—" : stats?.activeMembers}</p>
              <p className="text-xs text-emerald-600/70 mt-1 font-medium">In good standing</p>
            </div>
            <div className={`rounded-2xl p-6 border shadow-sm ${pendingRequests > 0 ? "bg-amber-50 border-amber-200" : "bg-card"}`}>
              <div className="flex items-center gap-2 mb-3 text-amber-600">
                <Inbox className="h-4 w-4" />
                <h3 className="font-bold text-xs uppercase tracking-wide text-foreground">HQ Requests</h3>
              </div>
              <p className={`text-4xl font-bold font-serif ${pendingRequests > 0 ? "text-amber-700" : ""}`}>{statsLoading ? "—" : pendingRequests}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Awaiting action</p>
            </div>
            <div className="bg-card rounded-2xl p-6 border shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-sky-600">
                <MessageSquare className="h-4 w-4" />
                <h3 className="font-bold text-xs uppercase tracking-wide text-foreground">Open Feedback</h3>
              </div>
              <p className="text-4xl font-bold font-serif">{statsLoading ? "—" : openFeedback}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Member submissions</p>
            </div>
          </div>
        </div>

        {/* Management Tools */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Management Tools</h2>
          <QuickGrid sections={HQ_MGMT_SECTIONS} />
        </div>

        {/* Jurisdiction Overview */}
        {!statsLoading && stats && stats.villages.length > 0 && (
          <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b bg-muted/20 flex items-center justify-between">
              <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Village Breakdown
              </h2>
              <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {stats.villages.length} {stats.villages.length === 1 ? "Village" : "Villages"}
              </span>
            </div>
            <div className="divide-y">
              {stats.villages.map(village => (
                <div key={village.villageId} className="p-8">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" /> {village.villageName}
                    </h3>
                    <div className="flex gap-3">
                      <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">{village.memberCount} Members</span>
                      <span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{village.activeCount} Active</span>
                    </div>
                  </div>
                  {village.units && village.units.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {village.units.map(unit => (
                        <div key={unit.unitId} className="bg-muted/30 rounded-xl p-4 border border-border/50">
                          <h4 className="font-bold text-sm mb-1">{unit.unitName}</h4>
                          <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>{unit.leaderName || "No Leader"}</span>
                            <span>{unit.memberCount} members</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <BirthdayPanel birthdays={allBirthdays} loading={birthdaysLoading} baseUrl={baseUrl} />
        <UpdatesEventsPanel updates={recentUpdates} events={upcomingEvents} updatesLoading={updatesLoading} eventsLoading={eventsLoading} baseUrl={baseUrl} />
      </div>
    );
  }

  // ── Village/Unit Leader View ───────────────────────────────────────────────
  if (isLeader) {
    const roleLabel: Record<string, string> = {
      village_head: "Village Head",
      unit_leader:  "Unit Leader",
      secretary:    "Secretary",
      treasurer:    "Treasurer",
    };
    return (
      <div className="space-y-8 animate-in-stagger">

        {/* Leader Banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-primary text-primary-foreground p-8 rounded-3xl relative overflow-hidden shadow-lg border border-primary/20">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="w-48 h-48 translate-x-12 -translate-y-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground/60">
                {roleLabel[member.role] || member.role.replace(/_/g, " ")}
              </span>
              {member.villageName && (
                <>
                  <span className="text-primary-foreground/30">·</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground/60">{member.villageName}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-1 tracking-tight">
              {member.firstName} {member.lastName}
            </h1>
            <p className="text-primary-foreground/70 font-medium">
              {member.villageName ? `Managing ${member.villageName}` : "Greater Bayelsa"}
              {member.unitName ? ` · ${member.unitName}` : ""}
            </p>
          </div>
          <div className="relative z-10 flex gap-3">
            {!statsLoading && stats && (
              <>
                <div className="bg-background/10 rounded-xl px-4 py-3 backdrop-blur-sm border border-background/10">
                  <p className="text-xs text-primary-foreground/70 font-bold uppercase tracking-wider mb-1">Members</p>
                  <p className="text-2xl font-bold font-serif">{stats.totalMembers}</p>
                </div>
                <div className="bg-background/10 rounded-xl px-4 py-3 backdrop-blur-sm border border-background/10">
                  <p className="text-xs text-primary-foreground/70 font-bold uppercase tracking-wider mb-1">Active</p>
                  <p className="text-2xl font-bold font-serif">{stats.activeMembers}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Management Tools */}
        <div>
          <h2 className="text-lg font-bold font-serif mb-4">Management Tools</h2>
          <QuickGrid sections={LEADER_MGMT_SECTIONS} />
        </div>

        {/* Jurisdiction Overview */}
        {!statsLoading && stats && stats.villages.length > 0 && (
          <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b bg-muted/20">
              <h2 className="text-xl font-bold font-serif">Jurisdiction Overview</h2>
            </div>
            <div className="divide-y">
              {stats.villages.map(village => (
                <div key={village.villageId} className="p-8">
                  <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                    <h3 className="text-xl font-bold">{village.villageName}</h3>
                    <div className="flex gap-4">
                      <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">{village.memberCount} Members</span>
                      <span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{village.activeCount} Active</span>
                    </div>
                  </div>
                  {village.units && village.units.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {village.units.map(unit => (
                        <div key={unit.unitId} className="bg-muted/30 rounded-xl p-4 border border-border/50">
                          <h4 className="font-bold text-sm mb-1">{unit.unitName}</h4>
                          <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>{unit.leaderName || "No Leader"}</span>
                            <span>{unit.memberCount} members</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <BirthdayPanel birthdays={allBirthdays} loading={birthdaysLoading} baseUrl={baseUrl} />
        <UpdatesEventsPanel updates={recentUpdates} events={upcomingEvents} updatesLoading={updatesLoading} eventsLoading={eventsLoading} baseUrl={baseUrl} />
      </div>
    );
  }

  // ── Regular Member View ───────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in-stagger">

      {/* Member Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-primary text-primary-foreground p-8 rounded-3xl relative overflow-hidden shadow-lg border border-primary/20">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity className="w-48 h-48 translate-x-12 -translate-y-12" />
        </div>
        <div className="relative z-10">
          <p className="text-primary-foreground/70 font-bold uppercase tracking-wider text-xs mb-2">Welcome Back</p>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-1 tracking-tight">
            {member.firstName} {member.lastName}
          </h1>
          <p className="text-primary-foreground/80 font-medium">
            {member.villageName || "HQ"} • {member.role.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="relative z-10">
          <div className={`rounded-xl px-4 py-3 backdrop-blur-sm border ${
            isInducted
              ? "bg-emerald-500/20 border-emerald-400/30"
              : "bg-background/10 border-background/10"
          }`}>
            <p className="text-xs text-primary-foreground/70 font-bold uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center text-sm font-bold">
              {isInducted
                ? <><Award className="w-4 h-4 mr-2 text-emerald-300" /> Full Member</>
                : <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Active Member</>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Membership Pipeline + ID Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Membership Pipeline</h2>
            <Link href="/induction" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isComplete = idx < pipelineIdx;
              const isCurrent  = idx === pipelineIdx;
              return (
                <div key={stage.key} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  isCurrent  ? "bg-primary/10 border border-primary/20" :
                  isComplete ? "bg-emerald-50 border border-emerald-100" :
                               "bg-muted/20 border border-transparent"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isComplete ? "bg-emerald-500 text-white" :
                    isCurrent  ? "bg-primary text-white" :
                                 "bg-muted text-muted-foreground"
                  }`}>
                    {isComplete ? <CheckCircle2 className="w-3 h-3" /> :
                     isCurrent  ? <stage.icon className="w-3 h-3" /> :
                                  <Lock className="w-2.5 h-2.5" />}
                  </div>
                  <p className={`text-xs font-bold flex-1 ${
                    isCurrent ? "text-primary" : isComplete ? "text-emerald-700" : "text-muted-foreground/60"
                  }`}>{stage.label}</p>
                  {isCurrent && <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">NOW</span>}
                  {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {isInducted ? (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Digital ID Card</h2>
              <MemberIdCard member={member} />
            </div>
          ) : (
            <Link href="/induction">
              <div className="h-full min-h-[200px] bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/40 hover:shadow-md transition-all gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Award className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-bold font-serif text-lg mb-1">Complete Your Induction</p>
                  <p className="text-sm text-muted-foreground font-medium">
                    {(member as any).inductionStatus === "pledge_submitted"
                      ? "Pledge submitted — awaiting Village Head confirmation."
                      : duesPaid ? "Upload your pledge video and ceremony photos."
                      : "Pay your dues to unlock the induction upload."}
                  </p>
                </div>
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  Go to Induction <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Member Quick Access */}
      <div>
        <h2 className="text-lg font-bold font-serif mb-4">Quick Access</h2>
        <QuickGrid sections={MEMBER_SECTIONS} />
      </div>

      <UpdatesEventsPanel updates={recentUpdates} events={upcomingEvents} updatesLoading={updatesLoading} eventsLoading={eventsLoading} baseUrl={baseUrl} />
    </div>
  );
}
