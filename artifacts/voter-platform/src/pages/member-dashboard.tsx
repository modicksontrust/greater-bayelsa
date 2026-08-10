import { useGetMe, useGetMyCoordinator, useListPosts, useListEvents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { format } from "date-fns";
import { MapPin, User, Calendar, Bell, ChevronRight, Briefcase, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MemberDashboard() {
  const { data: member } = useGetMe({ query: { queryKey: ["/api/me"] }});
  
  // 404 for coordinator is treated as state (none assigned yet)
  const { data: coordinator } = useGetMyCoordinator({ query: { queryKey: ["/api/me/coordinator"] }});
  
  const { data: posts } = useListPosts(undefined, { query: { queryKey: ["/api/posts", "all"] }});
  const { data: events } = useListEvents({ query: { queryKey: ["/api/events"] }});

  if (!member) return null;

  return (
    <div className="space-y-6 pb-12 animate-in-stagger">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Welcome back, {member.firstName}!</h1>
        <p className="text-muted-foreground mt-1">Here is what's happening in your community.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Membership Card */}
        <div className="md:col-span-2">
          <Card className="bg-gradient-to-br from-primary to-primary/80 border-0 shadow-lg text-primary-foreground overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="text-primary-foreground/70 uppercase tracking-widest text-xs font-bold mb-1">
                    Membership ID
                  </div>
                  <div className="font-mono text-2xl tracking-wider font-bold">
                    {member.membershipCode}
                  </div>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  {member.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <div className="text-primary-foreground/70 text-xs uppercase tracking-wider mb-1">Name</div>
                  <div className="font-bold text-lg font-serif">{member.firstName} {member.lastName}</div>
                </div>
                <div>
                  <div className="text-primary-foreground/70 text-xs uppercase tracking-wider mb-1">Category</div>
                  <div className="font-medium capitalize">{member.membershipCategory.replace('_', ' ')}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-primary-foreground/70 text-xs uppercase tracking-wider mb-1">Base</div>
                  <div className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {member.lga} LGA • Ward {member.ward} • PU {member.pollingUnit}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coordinator Info */}
        <div>
          <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Your Area Shepherd
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex flex-col justify-center">
              {coordinator ? (
                <div className="text-center">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl mx-auto mb-4">
                    {coordinator.firstName[0]}{coordinator.lastName[0]}
                  </div>
                  <h3 className="font-bold text-lg font-serif">{coordinator.firstName} {coordinator.lastName}</h3>
                  <p className="text-sm text-muted-foreground capitalize mt-1 mb-4">{coordinator.role.replace('_', ' ')}</p>
                  <a href={`tel:${coordinator.phone}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 px-4 border border-border">
                    Contact Coordinator
                  </a>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-5 w-5 opacity-50" />
                  </div>
                  <p className="text-sm">No coordinator assigned to your area yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Latest News */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
            <CardTitle className="text-lg">Recent Updates</CardTitle>
            <Link href="/news" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="divide-y divide-border/50">
              {posts?.slice(0, 3).map(post => (
                <Link key={post.id} href={`/news/${post.id}`} className="block p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{post.category}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{format(new Date(post.createdAt), 'MMM d')}</span>
                  </div>
                  <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{post.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.body}</p>
                </Link>
              ))}
              {!posts?.length && (
                <div className="p-8 text-center text-muted-foreground text-sm">No recent updates.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="divide-y divide-border/50">
              {events?.slice(0, 3).map(event => {
                const eventDate = new Date(event.startsAt);
                return (
                  <div key={event.id} className="p-4 flex gap-4 items-start">
                    <div className="shrink-0 text-center border border-border/50 rounded-lg overflow-hidden bg-card w-14">
                      <div className="bg-primary text-primary-foreground text-[10px] font-bold uppercase py-1">
                        {format(eventDate, 'MMM')}
                      </div>
                      <div className="text-xl font-bold py-1">
                        {format(eventDate, 'd')}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{event.title}</h4>
                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {event.location}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
                    </div>
                  </div>
                );
              })}
              {!events?.length && (
                <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                  <Calendar className="h-8 w-8 mb-2 opacity-20" />
                  No upcoming events scheduled.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Link href="/opportunities" className="bg-card border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-primary hover:bg-primary/5 transition-all shadow-sm group">
          <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:scale-110 transition-transform">
            <Briefcase className="h-6 w-6" />
          </div>
          <span className="font-bold font-serif">Jobs & Scholarships</span>
        </Link>
        <Link href="/notifications" className="bg-card border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-primary hover:bg-primary/5 transition-all shadow-sm group">
          <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:scale-110 transition-transform">
            <Bell className="h-6 w-6" />
          </div>
          <span className="font-bold font-serif">Notifications</span>
        </Link>
        <Link href="/profile" className="bg-card border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-primary hover:bg-primary/5 transition-all shadow-sm group">
          <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:scale-110 transition-transform">
            <User className="h-6 w-6" />
          </div>
          <span className="font-bold font-serif">My Profile</span>
        </Link>
        <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" className="bg-card border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-primary hover:bg-primary/5 transition-all shadow-sm group">
          <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:scale-110 transition-transform">
            <MapPin className="h-6 w-6" />
          </div>
          <span className="font-bold font-serif">Help / Support</span>
        </a>
      </div>
    </div>
  );
}