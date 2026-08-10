import { useState } from "react";
import { useListPosts } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Briefcase, GraduationCap, ArrowUpRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "wouter";

export function Opportunities() {
  const [filter, setFilter] = useState<"all" | "job" | "scholarship">("all");
  const { data: posts, isLoading } = useListPosts({ category: filter === "all" ? undefined : filter }, { query: { queryKey: ["/api/posts", filter] } });

  // Only show jobs and scholarships locally just in case
  const opportunities = posts?.filter(p => p.category === "job" || p.category === "scholarship") || [];

  return (
    <div className="space-y-6 animate-in-stagger pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground mt-1">Exclusive jobs and scholarships for Greater Bayelsa members.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm" className="rounded-full">All</Button>
          <Button variant={filter === "job" ? "default" : "outline"} onClick={() => setFilter("job")} size="sm" className="rounded-full gap-1">
            <Briefcase className="h-3 w-3" /> Jobs
          </Button>
          <Button variant={filter === "scholarship" ? "default" : "outline"} onClick={() => setFilter("scholarship")} size="sm" className="rounded-full gap-1">
            <GraduationCap className="h-3 w-3" /> Scholarships
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-card border border-border/50 rounded-2xl h-[250px]" />)}
        </div>
      ) : opportunities.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {opportunities.map(post => (
            <Card key={post.id} className="border-border/50 shadow-sm hover:border-primary/30 transition-colors flex flex-col group">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${post.category === 'job' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {post.category === 'job' ? <Briefcase className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                    </div>
                    <Badge variant="outline" className="capitalize border-border">{post.category}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(post.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-serif mb-2 text-foreground group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                  {post.body}
                </p>
                <div className="pt-4 border-t border-border/50 mt-auto">
                  <Link href={`/news/${post.id}`} className={buttonVariants({ variant: "ghost", className: "w-full justify-between hover:text-primary hover:bg-primary/5" })}>
                    View Details <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl border border-border/50 shadow-sm">
          <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold font-serif mb-2">No opportunities found</h3>
          <p className="text-muted-foreground">Check back later for new jobs and scholarships.</p>
        </div>
      )}
    </div>
  );
}