import { useState } from "react";
import { useParams, Link } from "wouter";
import { useListPosts, useGetPost, getGetPostQueryKey } from "@workspace/api-client-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Tag, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { id: "all", label: "All Updates" },
  { id: "news", label: "News" },
  { id: "announcement", label: "Announcements" },
  { id: "job", label: "Jobs" },
  { id: "scholarship", label: "Scholarships" },
];

export function News({ detail = false }: { detail?: boolean }) {
  const [category, setCategory] = useState<string>("all");
  const params = useParams();

  if (detail && params.id) {
    return <NewsDetail id={Number(params.id)} />;
  }

  const { data: posts, isLoading } = useListPosts(category !== "all" ? { category } : undefined);

  return (
    <div className="animate-in-stagger pb-20">
      <div className="bg-muted/30 py-16 border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold font-serif text-foreground mb-4">News & Updates</h1>
            <p className="text-xl text-muted-foreground">
              Stay informed about our latest activities, announcements, and opportunities for members.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.id ? "default" : "outline"}
              onClick={() => setCategory(cat.id)}
              className="rounded-full"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-card border border-border/50 rounded-2xl h-[300px]" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/news/${post.id}`} className="group block">
                <article className="bg-card border border-border/50 rounded-2xl p-6 h-full flex flex-col hover:border-primary/30 hover:shadow-md transition-all duration-300">
                  <div className="mb-4">
                    <Badge variant={post.category === "news" ? "default" : post.category === "announcement" ? "secondary" : "outline"} className="capitalize">
                      {post.category}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold font-serif mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-3 mb-6 flex-grow">
                    {post.body}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/50 mt-auto">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(post.createdAt), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1 text-primary font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      Read <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border border-dashed">
            <h3 className="text-xl font-bold mb-2">No updates found</h3>
            <p className="text-muted-foreground">Check back later for more news and opportunities.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewsDetail({ id }: { id: number }) {
  const { data: post, isLoading, error } = useGetPost(id, { query: { enabled: !!id, queryKey: getGetPostQueryKey(id) }});

  if (isLoading) {
    return <div className="container mx-auto px-4 py-20 min-h-[50vh] flex items-center justify-center">Loading...</div>;
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Post not found</h2>
        <Link href="/news" className={buttonVariants({ variant: "default" })}>Back to News</Link>
      </div>
    );
  }

  return (
    <div className="animate-in-stagger pb-20">
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
        <Link href="/news" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to all updates
        </Link>

        <article>
          <header className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <Badge className="capitalize">{post.category}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.createdAt), 'MMMM d, yyyy')}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-serif text-foreground leading-tight">
              {post.title}
            </h1>
          </header>
          
          <div className="prose prose-lg prose-green max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {post.body}
          </div>
        </article>
      </div>
    </div>
  );
}