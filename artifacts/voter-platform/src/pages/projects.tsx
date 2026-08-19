import { PublicLayout } from "@/components/public-layout";
import { useListPosts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ArrowRight, BookOpen, Calendar, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type ContentPost = {
  id: number;
  title: string;
  body: string;
  category: string;
  imageUrl?: string | null;
  createdAt: string;
};

function ReportCards({ posts, emptyMessage }: { posts: ContentPost[]; emptyMessage: string }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-dashed rounded-2xl">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <Link key={post.id} href={`/news/${post.id}`} className="group block h-full">
          <article className="bg-card h-full rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            {post.imageUrl ? (
              <div className="h-56 overflow-hidden bg-muted">
                <img
                  src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/storage${post.imageUrl}`}
                  alt={post.title}
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
                  {post.category}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(post.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              <h3 className="text-xl font-bold font-serif mb-3 group-hover:text-primary transition-colors leading-snug">
                {post.title}
              </h3>
              <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                {post.body}
              </p>
              <div className="flex items-center text-primary font-bold text-sm">
                Read More
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

function TestimonialCards({ posts }: { posts: ContentPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-dashed rounded-2xl">
        <Quote className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Community testimonials will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Link key={post.id} href={`/news/${post.id}`} className="group block h-full">
          <article className="relative bg-card h-full rounded-2xl border p-7 shadow-sm hover:shadow-md transition-all duration-300">
            <Quote className="absolute right-6 top-6 h-10 w-10 text-accent/30" />
            {post.imageUrl && (
              <img
                src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/storage${post.imageUrl}`}
                alt=""
                className="h-12 w-12 rounded-full object-cover mb-5 border-2 border-accent/40"
              />
            )}
            <p className="text-foreground/80 leading-relaxed mb-6 line-clamp-5">“{post.body}”</p>
            <div className="border-t pt-4">
              <h3 className="font-bold font-serif group-hover:text-primary transition-colors">{post.title}</h3>
              <span className="text-xs text-muted-foreground font-medium">
                {format(new Date(post.createdAt), "MMMM yyyy")}
              </span>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

export function Projects() {
  const { data: developmentPosts, isLoading: developmentLoading } = useListPosts({ category: "development" });
  const { data: impactPosts, isLoading: impactLoading } = useListPosts({ category: "impact" });
  const { data: testimonialPosts, isLoading: testimonialLoading } = useListPosts({ category: "testimonial" });
  const isLoading = developmentLoading || impactLoading || testimonialLoading;

  return (
    <PublicLayout>
      <div className="bg-muted/30 pt-16 pb-16 border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center animate-in-stagger">
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 tracking-tight">Projects</h1>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
              Development work, measurable impact, and community voices from across Greater Bayelsa.
            </p>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 md:px-6 py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-3">Development</p>
          <h2 className="text-3xl font-bold font-serif mb-3">Projects in Our Communities</h2>
          <p className="text-muted-foreground">Initiatives and development work being advanced across the constituency.</p>
        </div>

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
        ) : (
          <ReportCards
            posts={developmentPosts ?? []}
            emptyMessage="Projects will appear here as they are published."
          />
        )}
      </section>

      <section className="bg-muted/30 border-y py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-3">Results & Voices</p>
            <h2 className="text-3xl font-bold font-serif mb-3">Impact & Testimonials</h2>
            <p className="text-muted-foreground">
              Evidence of progress alongside direct stories from the people and communities involved.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((item) => <Skeleton key={item} className="h-72 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-16">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-serif">Impact Reports</h3>
                  <Badge variant="outline" className="font-semibold">{impactPosts?.length ?? 0} published</Badge>
                </div>
                <ReportCards
                  posts={impactPosts ?? []}
                  emptyMessage="Impact reports will appear here as they are published."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-serif">Community Testimonials</h3>
                  <Badge variant="outline" className="font-semibold">{testimonialPosts?.length ?? 0} published</Badge>
                </div>
                <TestimonialCards posts={testimonialPosts ?? []} />
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}