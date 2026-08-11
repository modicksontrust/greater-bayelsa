import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { useGetMe } from "@workspace/api-client-react";

import NotFound from "@/pages/not-found";
import { PublicLayout } from "@/components/public-layout";
import { DashboardLayout } from "@/components/dashboard-layout";

// Public Pages
import { Home } from "@/pages/home";
import { About } from "@/pages/about";
import { Leaders } from "@/pages/leaders";
import { News } from "@/pages/news";
import { Eligibility } from "@/pages/eligibility";
import { Register } from "@/pages/register";

// Portal Pages
import { Dashboard } from "@/pages/portal/dashboard";
import { Profile } from "@/pages/portal/profile";
import { Members } from "@/pages/portal/members";
import { MemberDetail } from "@/pages/portal/member-detail";
import { Enroll } from "@/pages/portal/enroll";
import { Dues } from "@/pages/portal/dues";
import { Training } from "@/pages/portal/training";
import { Meetings } from "@/pages/portal/meetings";
import { MeetingNew } from "@/pages/portal/meeting-new";
import { MeetingDetail } from "@/pages/portal/meeting-detail";
import { Checkin } from "@/pages/portal/checkin";
import { Calendar } from "@/pages/portal/calendar";
import { Updates } from "@/pages/portal/updates";
import { Feedback } from "@/pages/portal/feedback";
import { Notifications } from "@/pages/portal/notifications";

// Admin Pages
import { AdminRequests } from "@/pages/admin/requests";
import { AdminFeedback } from "@/pages/admin/feedback";
import { AdminVoters } from "@/pages/admin/voters";
import { AdminMessaging } from "@/pages/admin/messaging";
import { AdminContent } from "@/pages/admin/content";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401 || 
            error?.response?.status === 403 || 
            error?.response?.status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(150, 60%, 25%)",
    colorForeground: "hsl(150, 50%, 12%)",
    colorMutedForeground: "hsl(150, 20%, 45%)",
    colorDanger: "hsl(0, 75%, 55%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(150, 20%, 88%)",
    colorInputForeground: "hsl(150, 50%, 12%)",
    colorNeutral: "hsl(150, 20%, 88%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-xl w-[440px] max-w-full overflow-hidden border border-border shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none bg-muted/30",
    headerTitle: "text-2xl font-serif font-bold text-foreground tracking-tight",
    headerSubtitle: "text-muted-foreground font-medium",
    socialButtonsBlockButtonText: "text-foreground font-bold",
    formFieldLabel: "text-foreground font-bold",
    footerActionLink: "text-primary hover:text-primary/80 font-bold",
    footerActionText: "text-muted-foreground font-medium",
    dividerText: "text-muted-foreground bg-white font-bold text-xs uppercase tracking-widest",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-emerald-600 font-bold",
    alertText: "text-destructive font-bold",
    logoBox: "h-20 flex items-center justify-center mb-6 bg-primary/5 rounded-lg border border-primary/10",
    logoImage: "h-12 w-auto filter grayscale opacity-80",
    socialButtonsBlockButton: "border-border hover:bg-muted transition-colors shadow-sm",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md transition-all h-11",
    formFieldInput: "border-border focus:ring-ring focus:border-ring bg-white text-foreground placeholder:text-muted-foreground h-11 shadow-sm",
    footerAction: "bg-muted/30 py-5 px-8 border-t border-border mt-6",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20 text-destructive",
    otpCodeFieldInput: "border-border text-foreground",
    formFieldRow: "space-y-4",
    main: "p-8",
  },
};

function SignInPage() {
  return (
    <PublicLayout>
      <div className="flex min-h-[75dvh] items-center justify-center px-4 py-16 bg-muted/20">
        <SignIn routing="path" path={`${basePath}/sign-in`} />
      </div>
    </PublicLayout>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

const COORDINATOR_ROLES = ["unit_leader", "village_head", "secretary", "treasurer", "assistant", "founder"];

function MemberRouteWrapper({
  children,
  coordinatorOnly,
}: {
  children: React.ReactNode;
  coordinatorOnly?: boolean;
}) {
  const { data: member, isLoading, error } = useGetMe({ 
    query: { queryKey: ["/api/me"] } 
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center font-serif text-lg font-bold text-primary animate-pulse">Loading Institution Portal...</div>;
  }

  if (coordinatorOnly && member && !COORDINATOR_ROLES.includes(member.role)) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold font-serif mb-3">Coordinator Access Only</h2>
          <p className="text-muted-foreground">
            This area is reserved for coordinators. If you believe you should have access, contact HQ.
          </p>
        </div>
      </PublicLayout>
    );
  }

  const status = (error as any)?.response?.status;
  if (error && (status === 404 || status === 403)) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold font-serif mb-3">Membership Not Found</h2>
          <p className="text-muted-foreground mb-8">
            Your login is valid, but we cannot find an active member record associated with this account. Membership accounts are created exclusively by Coordinators.
          </p>
          <div className="space-y-3 w-full">
            <p className="text-sm font-bold">Please contact your Village Coordinator for assistance.</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return <>{children}</>;
}

function HQRouteWrapper({ children }: { children: React.ReactNode }) {
  const { data: member, isLoading } = useGetMe({ 
    query: { queryKey: ["/api/me"] } 
  });
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (member?.role !== "founder" && member?.role !== "assistant") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <h2 className="text-2xl font-bold font-serif mb-2">HQ Clearance Required</h2>
          <p className="text-muted-foreground">This section is restricted to Headquarters administration.</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return <>{children}</>;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [location, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      localization={{
        signIn: {
          start: {
            title: "Member Login",
            subtitle: "Access the Greater Bayelsa Portal",
          },
        }
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        
        <ErrorBoundary>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/about" component={About} />
          <Route path="/leaders" component={Leaders} />
          <Route path="/news">{() => <News />}</Route>
          <Route path="/news/:id">{() => <News detail />}</Route>
          <Route path="/eligibility" component={Eligibility} />
          <Route path="/register" component={Register} />
          
          <Route path="/sign-in/*?" component={SignInPage} />

          {/* Portal Routes */}
          <Route path="/dashboard">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Dashboard /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>
          
          <Route path="/profile">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Profile /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/members">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Members /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/members/:id">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><MemberDetail /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/enroll">
            <Show when="signed-in">
              <MemberRouteWrapper coordinatorOnly>
                <DashboardLayout><Enroll /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/dues">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Dues /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/training">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Training /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/meetings">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Meetings /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/meetings/new">
            <Show when="signed-in">
              <MemberRouteWrapper coordinatorOnly>
                <DashboardLayout><MeetingNew /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/meetings/:id">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><MeetingDetail /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/checkin">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Checkin /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/calendar">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Calendar /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/updates">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Updates /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/feedback">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Feedback /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/notifications">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Notifications /></DashboardLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/requests">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <HQRouteWrapper>
                  <DashboardLayout><AdminRequests /></DashboardLayout>
                </HQRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>
          
          <Route path="/admin/feedback">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <HQRouteWrapper>
                  <DashboardLayout><AdminFeedback /></DashboardLayout>
                </HQRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/admin/voters">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <HQRouteWrapper>
                  <DashboardLayout><AdminVoters /></DashboardLayout>
                </HQRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/admin/messaging">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <HQRouteWrapper>
                  <DashboardLayout><AdminMessaging /></DashboardLayout>
                </HQRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/admin/content">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <HQRouteWrapper>
                  <DashboardLayout><AdminContent /></DashboardLayout>
                </HQRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route component={() => <PublicLayout><NotFound /></PublicLayout>} />
        </Switch>
        </ErrorBoundary>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
