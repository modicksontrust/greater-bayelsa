import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, Users, UserPlus, Menu, UserCircle, 
  Briefcase, Bell, Settings, FileText, Database, Send, LogOut, ChevronRight
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
  
  const isAdmin = member?.role === "admin";

  const memberNav = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Profile", path: "/profile", icon: UserCircle },
    { name: "Opportunities", path: "/opportunities", icon: Briefcase },
    { name: "Notifications", path: "/notifications", icon: Bell },
  ];

  const adminNav = [
    { name: "Admin Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Member Directory", path: "/admin/members", icon: Users },
    { name: "Manage Content", path: "/admin/content", icon: FileText },
    { name: "Broadcasts", path: "/admin/notifications", icon: Send },
    { name: "Voter Database", path: "/admin/voters", icon: Database },
    { name: "Register Voter", path: "/admin/register", icon: UserPlus },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-white p-1 rounded-lg overflow-hidden flex items-center justify-center h-10 w-10 shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="Greater Bayelsa"
              className="h-full w-full object-contain filter invert"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold font-serif tracking-tight text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">
              Greater Bayelsa
            </h2>
            <p className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-widest mt-0.5">Portal</p>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-4 pb-2 mb-2">
          <h3 className="text-xs font-bold text-sidebar-foreground/40 uppercase tracking-wider mb-2 px-3">Personal</h3>
          <nav className="space-y-1">
            {memberNav.map((item) => {
              const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path) && !location.startsWith("/admin"));
              return (
                <Link key={item.path} href={item.path} className="block">
                  <div className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {isAdmin && (
          <div className="px-4 mt-6">
            <h3 className="text-xs font-bold text-sidebar-primary uppercase tracking-wider mb-2 px-3">Administration</h3>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const isActive = location === item.path || (item.path !== "/admin" && location.startsWith(item.path));
                return (
                  <Link key={item.path} href={item.path} className="block">
                    <div className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-primary/20 text-sidebar-primary"
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
        )}
      </div>

      <div className="p-4 mt-auto border-t border-sidebar-border">
        {member ? (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/30 mb-4">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-xs uppercase shrink-0">
              {member.firstName[0]}{member.lastName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{member.firstName} {member.lastName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate font-mono">{member.membershipCode}</p>
            </div>
          </div>
        ) : null}
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || "/" })}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] w-full bg-background selection:bg-primary/20">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 lg:w-72 shrink-0 border-r bg-sidebar md:block">
        <SidebarContent />
      </div>

      {/* Mobile Header & Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-1 rounded h-8 w-8 flex items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}logo.svg`}
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="text-sm font-bold font-serif">GB Portal</h1>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80vw] max-w-sm bg-sidebar p-0 border-r-0">
              <SheetTitle className="sr-only">Dashboard Navigation</SheetTitle>
              <SheetDescription className="sr-only">Navigation links for the member portal</SheetDescription>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/20">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}