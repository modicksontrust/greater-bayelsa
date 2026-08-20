import { PublicLayout } from "@/components/public-layout";
import { useListPosts, useGetPost } from "@workspace/api-client-react";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, BookOpen, Calendar, Tag, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function getPostImageUrls(post: { imageUrl?: string | null; imageUrls?: string[] | null }) {
  return Array.from(
    new Set([post.imageUrl, ...(post.imageUrls ?? [])].filter((url): url is string => Boolean(url))),
  );
}

export function News({ detail = false }: { detail?: boolean }) {
  const [match, params] = useRoute("/news/:id");
  const id = detail && match ? parseInt(params.id, 10) : null;

  if (detail && id) {
    return <NewsDetail id={id} />;
  }

  return <NewsList />;
}

function NewsList() {
  const { data: posts, isLoading } = useListPosts({ category: "news" });

  return (
    <PublicLayout>
      <div className="bg-muted/30 pt-16 pb-16 border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center animate-in-stagger">
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 tracking-tight">News / Institutional Updates</h1>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
              Official news, institutional announcements, and updates from Greater Bayelsa.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="bg-card rounded-2xl border overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts?.map((post) => (
            <Link key={post.id} href={`/news/${post.id}`} className="group block h-full">
                <div className="bg-card h-full rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  {post.imageUrl ? (
                    <div className="h-56 overflow-hidden bg-muted">
                      <img 
                        src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${post.imageUrl}`} 
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
                        {format(new Date(post.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold font-serif mb-3 group-hover:text-primary transition-colors leading-snug">{post.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">{post.body}</p>
                    <div className="flex items-center text-primary font-bold text-sm">
                      Read Full Report <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {posts?.length === 0 && (
              <div className="col-span-full text-center py-20 bg-muted/20 border border-dashed rounded-2xl">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold font-serif mb-2">No Reports Yet</h3>
                <p className="text-muted-foreground">Check back soon for official updates.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function NewsDetail({ id }: { id: number }) {
  const { data: post, isLoading, error } = useGetPost(id, {
    query: { queryKey: ["/api/posts", id] }
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-3/4 mb-8" />
          <Skeleton className="h-64 w-full mb-8 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !post) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold font-serif mb-4">Report Not Found</h2>
          <Link href="/news" className={buttonVariants({ variant: "outline" })}>
            Back to News
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const galleryImages = getPostImageUrls(post);
  const coverImage = galleryImages[0];

  return (
    <PublicLayout>
      <article className="pb-24">
        {coverImage ? (
          <div className="w-full h-[40vh] md:h-[50vh] relative bg-muted">
            <img 
              src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${coverImage}`} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 container mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-accent text-primary hover:bg-accent font-bold uppercase tracking-wider text-xs border-0">
                  {post.category}
                </Badge>
                <span className="text-white/80 font-medium flex items-center text-sm shadow-sm">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-serif text-white tracking-tight leading-[1.1] max-w-4xl shadow-sm">
                {post.title}
              </h1>
            </div>
          </div>
        ) : (
          <div className="bg-primary text-white pt-24 pb-16 mb-12">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
              <Link href="/news" className="inline-flex items-center text-white/70 hover:text-white mb-8 font-medium transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to News
              </Link>
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-accent text-primary hover:bg-accent font-bold uppercase tracking-wider text-xs border-0">
                  {post.category}
                </Badge>
                <span className="text-white/80 font-medium flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif tracking-tight leading-[1.1]">
                {post.title}
              </h1>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 md:px-6 max-w-3xl mt-12 md:mt-16">
          {!coverImage && (
            <div className="hidden md:block mb-8">
              <Link href="/news" className="inline-flex items-center text-muted-foreground hover:text-foreground font-medium transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to News
              </Link>
            </div>
          )}
          
          <div className="prose prose-lg md:prose-xl prose-stone max-w-none">
            {post.body.split('\n').map((paragraph, i) => (
              paragraph ? <p key={i} className="leading-relaxed text-foreground/80">{paragraph}</p> : <br key={i} />
            ))}
          </div>

          {galleryImages.length > 1 && (
            <section className="mt-12" aria-labelledby="story-gallery-heading">
              <h2 id="story-gallery-heading" className="text-2xl font-bold font-serif mb-5">
                From the Training
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {galleryImages.map((imageUrl, index) => (
                  <img
                    key={imageUrl}
                    src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${imageUrl}`}
                    alt={`${post.title} — photo ${index + 1}`}
                    className="w-full aspect-[4/3] object-cover rounded-2xl border shadow-sm"
                  />
                ))}
              </div>
            </section>
          )}

          <div className="mt-16 pt-8 border-t flex justify-between items-center">
            <div className="flex items-center text-muted-foreground font-medium">
              <Tag className="h-4 w-4 mr-2" /> Official Dispatch
            </div>
            <Link href="/news" className={buttonVariants({ variant: "outline", className: "font-bold" })}>
              View More Updates
            </Link>
          </div>
        </div>
      </article>
    </PublicLayout>
  );
}
