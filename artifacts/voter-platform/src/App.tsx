import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
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

import { Home } from "@/pages/home";
import { About } from "@/pages/about";
import { Contact } from "@/pages/contact";
import { News } from "@/pages/news";

import { Onboarding } from "@/pages/onboarding";
import { MemberDashboard } from "@/pages/member-dashboard";
import { Profile } from "@/pages/profile";
import { Opportunities } from "@/pages/opportunities";
import { Notifications } from "@/pages/notifications";

import { AdminDashboard } from "@/pages/admin-dashboard";
import { AdminMembers } from "@/pages/admin-members";
import { AdminContent } from "@/pages/admin-content";
import { AdminNotifications } from "@/pages/admin-notifications";

// Voter endpoints
import { Voters } from "@/pages/voters";
import { RegisterVoter } from "@/pages/register";
import { VoterDetail } from "@/pages/voter-detail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403/404
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
    colorPrimary: "hsl(153, 60%, 25%)",
    colorForeground: "hsl(153, 50%, 12%)",
    colorMutedForeground: "hsl(153, 20%, 45%)",
    colorDanger: "hsl(0, 75%, 55%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(153, 20%, 88%)",
    colorInputForeground: "hsl(153, 50%, 12%)",
    colorNeutral: "hsl(153, 20%, 88%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none bg-muted/50",
    headerTitle: "text-2xl font-serif font-bold text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-semibold",
    footerActionLink: "text-primary hover:text-primary/80 font-bold",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground bg-white",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-destructive",
    logoBox: "h-16 flex items-center justify-center mb-4",
    logoImage: "h-full w-auto",
    socialButtonsBlockButton: "border-border hover:bg-muted transition-colors",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm transition-all",
    formFieldInput: "border-border focus:ring-ring focus:border-ring bg-white text-foreground placeholder:text-muted-foreground",
    footerAction: "bg-muted/50 py-4 px-8 border-t border-border mt-6",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20",
    otpCodeFieldInput: "border-border text-foreground",
    formFieldRow: "space-y-4",
    main: "p-8",
  },
};

function SignInPage() {
  return (
    <PublicLayout>
      <div className="flex min-h-[70dvh] items-center justify-center px-4 py-12">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </PublicLayout>
  );
}

function SignUpPage() {
  return (
    <PublicLayout>
      <div className="flex min-h-[70dvh] items-center justify-center px-4 py-12">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
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

function MemberRouteWrapper({ children }: { children: React.ReactNode }) {
  const { data: member, isLoading, error } = useGetMe({ 
    query: { queryKey: ["/api/me"] } 
  });
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (error && (error as any).response?.status === 404) {
        // Needs onboarding
        if (location !== "/onboarding") {
          setLocation("/onboarding");
        }
      } else if (member && location === "/onboarding") {
        // Already onboarded, shouldn't be here
        setLocation("/dashboard");
      }
    }
  }, [member, isLoading, error, location, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If error 404, we let them see the children which should be the onboarding component, or redirect happens
  return <>{children}</>;
}

function AdminRouteWrapper({ children }: { children: React.ReactNode }) {
  const { data: member, isLoading } = useGetMe({ 
    query: { queryKey: ["/api/me"] } 
  });
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (member?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <h2 className="text-2xl font-bold font-serif mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have administrative privileges to view this page.</p>
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
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Sign in to Greater Bayelsa",
            subtitle: "Access your member portal",
          },
        },
        signUp: {
          start: {
            title: "Join the Movement",
            subtitle: "Create an account to become a member",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        
        <ErrorBoundary>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/about" component={() => <PublicLayout><About /></PublicLayout>} />
          <Route path="/contact" component={() => <PublicLayout><Contact /></PublicLayout>} />
          <Route path="/news" component={() => <PublicLayout><News /></PublicLayout>} />
          <Route path="/news/:id" component={() => <PublicLayout><News detail /></PublicLayout>} />
          
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />

          {/* Member Portal Routes */}
          <Route path="/onboarding">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <PublicLayout>
                  <Onboarding />
                </PublicLayout>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out">
              <Redirect to="/sign-in" />
            </Show>
          </Route>

          <Route path="/dashboard">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><MemberDashboard /></DashboardLayout>
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

          <Route path="/opportunities">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <DashboardLayout><Opportunities /></DashboardLayout>
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
          <Route path="/admin">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <AdminRouteWrapper>
                  <DashboardLayout><AdminDashboard /></DashboardLayout>
                </AdminRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/admin/members">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <AdminRouteWrapper>
                  <DashboardLayout><AdminMembers /></DashboardLayout>
                </AdminRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/admin/content">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <AdminRouteWrapper>
                  <DashboardLayout><AdminContent /></DashboardLayout>
                </AdminRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>
          
          <Route path="/admin/notifications">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <AdminRouteWrapper>
                  <DashboardLayout><AdminNotifications /></DashboardLayout>
                </AdminRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          {/* Legacy Voter Routes mapped under Admin */}
          <Route path="/admin/voters">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <AdminRouteWrapper>
                  <DashboardLayout><Voters /></DashboardLayout>
                </AdminRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/admin/voters/:id">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <AdminRouteWrapper>
                  <DashboardLayout><VoterDetail /></DashboardLayout>
                </AdminRouteWrapper>
              </MemberRouteWrapper>
            </Show>
            <Show when="signed-out"><Redirect to="/sign-in" /></Show>
          </Route>

          <Route path="/admin/register">
            <Show when="signed-in">
              <MemberRouteWrapper>
                <AdminRouteWrapper>
                  <DashboardLayout><RegisterVoter /></DashboardLayout>
                </AdminRouteWrapper>
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