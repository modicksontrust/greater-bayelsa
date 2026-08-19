import { PublicLayout } from "@/components/public-layout";
import { useListPosts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function Projects() {
  const { data: impactPosts, isLoading: impactLoading } = useListPosts({ category: "impact" });
  const { data: developmentPosts, isLoading: developmentLoading } = useListPosts({ category: "development" });
  const isLoading = impactLoading || developmentLoading;
  const projects = [...(impactPosts ?? []), ...(developmentPosts ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <PublicLayout>
      <div className="bg-muted/30 pt-16 pb-16 border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center animate-in-stagger">
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 tracking-tight">Projects</h1>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
              Development work and measurable community impact from across Greater Bayelsa.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-card rounded-2xl border overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link key={project.id} href={`/news/${project.id}`} className="group block h-full">
                <article className="bg-card h-full rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  {project.imageUrl ? (
                    <div className="h-56 overflow-hidden bg-muted">
                      <img
                        src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/storage${project.imageUrl}`}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-56 bg-muted/50 flex items-center justify-center border-b">
                      <BookOpen className="h-16 w-16 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 font-bold uppercase tracking-wider text-[10px]">
                        {project.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(project.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold font-serif mb-3 group-hover:text-primary transition-colors leading-snug">
                      {project.title}
                    </h2>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                      {project.body}
                    </p>
                    <div className="flex items-center text-primary font-bold text-sm">
                      Read Project Report
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 border border-dashed rounded-2xl">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold font-serif mb-2">No Projects Yet</h2>
            <p className="text-muted-foreground">Community projects and impact reports will appear here.</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}