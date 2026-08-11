import { ReactNode, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, Users, UserPlus, Menu, UserCircle, 
  Briefcase, Bell, Settings, FileText, Database, Send, LogOut, ChevronRight,
  ClipboardList, ShieldCheck, MapPin, CheckSquare, MessageSquare, Calendar, Building, GraduationCap
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { data: member } = useGetMe({ query: { queryKey: ["/api/me"] }});
  const { signOut } = useClerk();
  
  const role = member?.role || "member";
  const isHQ = role === "founder" || role === "assistant";
  const isCoordinator = isHQ || role === "village_head" || role === "secretary" || role === "treasurer" || role === "unit_leader";

  const navGroups = useMemo(() => {
    const groups = [];

    // Personal / Member Group (Everyone sees this)
    groups.push({
      title: "Member Portal",
      items: [
        { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
        { name: "My Profile", path: "/profile", icon: UserCircle },
        { name: "Dues & Status", path: "/dues", icon: ShieldCheck },
        { name: "Member Development", path: "/training", icon: GraduationCap },
        { name: "Meetings", path: "/meetings", icon: Users },
        { name: "Calendar", path: "/calendar", icon: Calendar },
        { name: "Updates", path: "/updates", icon: Bell },
        { name: "HQ Feedback", path: "/feedback", icon: MessageSquare },
        { name: "Notifications", path: "/notifications", icon: ClipboardList },
      ]
    });

    // Coordinator Group
    if (isCoordinator) {
      groups.push({
        title: "Leadership",
        items: [
          { name: "Member Directory", path: "/members", icon: Users },
          { name: "Enroll Member", path: "/enroll", icon: UserPlus },
        ]
      });
    }

    // HQ Group
    if (isHQ) {
      groups.push({
        title: "HQ Administration",
        items: [
          { name: "HQ Requests", path: "/admin/requests", icon: CheckSquare },
          { name: "Member Feedback", path: "/admin/feedback", icon: MessageSquare },
          { name: "Voter Roll", path: "/admin/voters", icon: Database },
          { name: "Bulk Messaging", path: "/admin/messaging", icon: Send },
          { name: "Manage Content", path: "/admin/content", icon: FileText },
        ]
      });
    }

    return groups;
  }, [isCoordinator, isHQ]);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="Greater Bayelsa"
            className="h-10 w-10 object-contain shrink-0"
          />
          <div>
            <h2 className="text-lg font-bold font-serif tracking-tight text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">
              Greater Bayelsa
            </h2>
            <p className="text-[10px] font-bold text-sidebar-primary uppercase tracking-widest mt-0.5">Institution Portal</p>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {navGroups.map((group, idx) => (
          <div key={group.title} className={`px-4 ${idx > 0 ? 'mt-6' : ''}`}>
            <h3 className="text-[11px] font-bold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-3">{group.title}</h3>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
                return (
                  <Link key={item.path} href={item.path} className="block">
                    <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-sidebar-primary/10 text-sidebar-primary shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}>
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.name}
                      </div>
                      {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-4 mt-auto border-t border-sidebar-border bg-sidebar-accent/10">
        {member ? (
          <div className="flex items-center gap-3 p-3 rounded-md bg-sidebar-accent/40 mb-3 border border-sidebar-border/50">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt="Avatar" className="h-10 w-10 rounded-sm object-cover bg-sidebar-primary/20" />
            ) : (
              <div className="h-10 w-10 rounded-sm bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-sm uppercase shrink-0">
                {member.firstName[0]}{member.lastName[0]}
              </div>
            )}
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-sidebar-foreground truncate leading-tight mb-1">{member.firstName} {member.lastName}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-sidebar-primary/20 text-sidebar-primary inline-block">
                  {member.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        ) : null}
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent font-semibold"
          onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || "/" })}
        >
          <LogOut className="h-4 w-4 mr-3" /> Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] w-full bg-background selection:bg-primary/20">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 lg:w-[280px] shrink-0 border-r border-sidebar-border bg-sidebar md:block shadow-xl z-10">
        <SidebarContent />
      </div>

      {/* Mobile Header & Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex h-16 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-md px-4 md:hidden sticky top-0 z-20 shadow-sm">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="Greater Bayelsa"
              className="h-8 w-8 object-contain shrink-0"
            />
            <div>
              <h1 className="text-sm font-bold font-serif leading-none">Greater Bayelsa</h1>
              <span className="text-[9px] uppercase tracking-widest text-primary font-bold">Portal</span>
            </div>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-[300px] bg-sidebar p-0 border-r-0 shadow-2xl">
              <SheetTitle className="sr-only">Dashboard Navigation</SheetTitle>
              <SheetDescription className="sr-only">Navigation links for the member portal</SheetDescription>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/30">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
