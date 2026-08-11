import { useGetMe, useGetOverviewStats, useListUpdates, useListEvents } from "@workspace/api-client-react";
import {
  Users, AlertCircle, FileText, Bell, CheckCircle2, Activity, Calendar,
  UserCircle, ShieldCheck, GraduationCap, MessageSquare, ClipboardList,
  UserPlus, CheckSquare, Database, Send, ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

// Quick-access sections — shown as a card grid on the dashboard
const MEMBER_SECTIONS = [
  { name: "My Profile",        path: "/profile",        icon: UserCircle,    color: "text-blue-600",   bg: "bg-blue-50"   },
  { name: "Dues & Status",     path: "/dues",           icon: ShieldCheck,   color: "text-emerald-600",bg: "bg-emerald-50"},
  { name: "Training",          path: "/training",       icon: GraduationCap, color: "text-violet-600", bg: "bg-violet-50" },
  { name: "Meetings",          path: "/meetings",       icon: Users,         color: "text-primary",    bg: "bg-primary/5" },
  { name: "Calendar",          path: "/calendar",       icon: Calendar,      color: "text-amber-600",  bg: "bg-amber-50"  },
  { name: "Updates",           path: "/updates",        icon: Bell,          color: "text-rose-600",   bg: "bg-rose-50"   },
  { name: "Feedback",          path: "/feedback",       icon: MessageSquare, color: "text-sky-600",    bg: "bg-sky-50"    },
  { name: "Notifications",     path: "/notifications",  icon: ClipboardList, color: "text-slate-600",  bg: "bg-slate-50"  },
];

const LEADER_SECTIONS = [
  { name: "Member Directory",  path: "/members",        icon: Users,         color: "text-indigo-600", bg: "bg-indigo-50" },
  { name: "Enroll Member",     path: "/enroll",         icon: UserPlus,      color: "text-teal-600",   bg: "bg-teal-50"   },
];

const HQ_SECTIONS = [
  { name: "HQ Requests",       path: "/admin/requests", icon: CheckSquare,   color: "text-orange-600", bg: "bg-orange-50" },
  { name: "Voter Roll",        path: "/admin/voters",   icon: Database,      color: "text-cyan-600",   bg: "bg-cyan-50"   },
  { name: "Manage Content",    path: "/admin/content",  icon: FileText,      color: "text-lime-700",   bg: "bg-lime-50"   },
  { name: "Bulk Messaging",    path: "/admin/messaging",icon: Send,          color: "text-pink-600",   bg: "bg-pink-50"   },
];

export function Dashboard() {
  const { data: member, isLoading: memberLoading } = useGetMe({
    query: { queryKey: ["/api/me"] }
  });

  const { data: stats, isLoading: statsLoading } = useGetOverviewStats({
    query: { queryKey: ["/api/overview-stats"] }
  });

  const { data: updates, isLoading: updatesLoading } = useListUpdates({
    query: { queryKey: ["/api/community-updates"] }
  });

  const { data: events, isLoading: eventsLoading } = useListEvents({
    query: { queryKey: ["/api/events"] }
  });

  if (memberLoading || !member) {
    return (
      <div className="space-y-8 animate-in-stagger">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const isLeader = ["founder", "assistant", "village_head", "unit_leader", "secretary", "treasurer"].includes(member.role);
  const isHQ    = member.role === "founder" || member.role === "assistant";
  const recentUpdates  = updates?.slice(0, 5) || [];
  const upcomingEvents = events?.slice(0, 3) || [];

  const quickSections = [
    ...MEMBER_SECTIONS,
    ...(isLeader ? LEADER_SECTIONS : []),
    ...(isHQ     ? HQ_SECTIONS     : []),
  ];

  return (
    <div className="space-y-8 animate-in-stagger">

      {/* Welcome banner */}
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
        <div className="relative z-10 flex gap-4">
          <div className="bg-background/10 rounded-xl px-4 py-3 backdrop-blur-sm border border-background/10">
            <p className="text-xs text-primary-foreground/70 font-bold uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center text-sm font-bold">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Active Member
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access — all sections in one glanceable grid */}
      <div>
        <h2 className="text-lg font-bold font-serif mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickSections.map((section) => (
            <Link key={section.path} href={section.path}>
              <div className="group bg-card border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                <div className={`${section.bg} ${section.color} rounded-xl p-2.5 shrink-0`}>
                  <section.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground leading-tight">{section.name}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading || !stats ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
        ) : (
          <>
            <div className="bg-card rounded-2xl p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-muted-foreground">
                <Users className="h-5 w-5" />
                <h3 className="font-bold text-sm">Total Members</h3>
              </div>
              <p className="text-4xl font-bold font-serif">{stats.totalMembers}</p>
            </div>
            <div className="bg-card rounded-2xl p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-emerald-600">
                <Activity className="h-5 w-5" />
                <h3 className="font-bold text-sm text-foreground">Active Members</h3>
              </div>
              <p className="text-4xl font-bold font-serif">{stats.activeMembers}</p>
            </div>
            {isHQ && (
              <>
                <div className="bg-card rounded-2xl p-6 border shadow-sm border-amber-200 bg-amber-50/30">
                  <div className="flex items-center gap-3 mb-4 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-bold text-sm text-foreground">Pending HQ Requests</h3>
                  </div>
                  <p className="text-4xl font-bold font-serif">{stats.pendingHqRequests || 0}</p>
                </div>
                <div className="bg-card rounded-2xl p-6 border shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-blue-600">
                    <FileText className="h-5 w-5" />
                    <h3 className="font-bold text-sm text-foreground">Open Feedback</h3>
                  </div>
                  <p className="text-4xl font-bold font-serif">{stats.openFeedback || 0}</p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Jurisdiction overview — leaders only */}
      {!statsLoading && stats && isLeader && stats.villages.length > 0 && (
        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b bg-muted/20">
            <h2 className="text-xl font-bold font-serif">Jurisdiction Overview</h2>
          </div>
          <div className="divide-y">
            {stats.villages.map(village => (
              <div key={village.villageId} className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">{village.villageName}</h3>
                  <div className="flex gap-4">
                    <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {village.memberCount} Members
                    </span>
                    <span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                      {village.activeCount} Active
                    </span>
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

      {/* Updates + Events */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold font-serif">Community Updates</h2>
            <Link href="/updates" className="text-sm font-bold text-primary hover:underline">View All</Link>
          </div>
          {updatesLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {recentUpdates.length > 0 ? recentUpdates.map(update => (
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
                    <span className="text-xs text-muted-foreground font-medium">
                      {format(new Date(update.createdAt), 'MMM d, h:mm a')}
                    </span>
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
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          ) : (
            <div className="bg-card rounded-3xl border shadow-sm overflow-hidden divide-y">
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
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
    </div>
  );
}
