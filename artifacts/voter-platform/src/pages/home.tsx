import { Link } from "wouter";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Users, Shield, BookOpen } from "lucide-react";
import { useListPosts } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/public-layout";

export function Home() {
  const { data: posts } = useListPosts({ category: "news" });
  const recentNews = posts?.slice(0, 3) || [];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary pt-24 pb-32">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="max-w-3xl animate-in-stagger">
            <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent mb-6">
              <span className="flex h-2 w-2 rounded-full bg-accent mr-2"></span>
              Developing Grassroots Leaders in Bayelsa
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-serif text-white tracking-tight leading-[1.1] mb-8">
              A Discipline of <br/><span className="text-accent">Civic Responsibility.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-10 leading-relaxed font-medium">
              Greater Bayelsa is not a campaign or a charity. We are a serious civic institution identifying, vetting, and developing a pipeline of principled leaders from the village level up.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className={buttonVariants({ size: "lg", className: "h-14 px-8 text-base font-bold bg-accent text-primary hover:bg-accent/90 shadow-xl" })}>
                Register Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/eligibility" className={buttonVariants({ variant: "outline", size: "lg", className: "h-14 px-8 text-base font-bold border-white/20 text-white hover:bg-white/10 hover:text-white" })}>
                Check Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-in-stagger">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">The Leadership Pipeline</h2>
            <p className="text-muted-foreground text-lg">We turn ordinary community members into structured, accountable civic leaders through a rigorous, tier-based system.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Strict Vetting",
                desc: "Membership requires verifying your identity on the active voter roll. Only serious participants are admitted."
              },
              {
                icon: BookOpen,
                title: "Structured Curriculum",
                desc: "Members progress through civic education, organized monthly meetings, and accountable action plans."
              },
              {
                icon: Users,
                title: "Hierarchical Accountability",
                desc: "From Unit to Village to District to Zone, our structure ensures every member is known and accountable."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <feature.icon className="w-32 h-32 text-primary translate-x-4 -translate-y-4" />
                </div>
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 relative z-10">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-serif mb-3 relative z-10">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed relative z-10">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof of Work / News */}
      <section className="py-24 bg-muted/30 border-t">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold font-serif mb-2">Institutional Updates</h2>
              <p className="text-muted-foreground">Latest news and development reports from our communities.</p>
            </div>
            <Link href="/news" className="hidden sm:flex items-center text-primary font-bold hover:underline">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {recentNews.length > 0 ? (
              recentNews.map(post => (
                <Link key={post.id} href={`/news/${post.id}`} className="group block h-full">
                  <div className="bg-card h-full rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    {post.imageUrl ? (
                      <div className="h-48 overflow-hidden bg-muted">
                        <img src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${post.imageUrl}`} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-48 bg-muted flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded">
                          {post.category}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold font-serif mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">{post.body}</p>
                      <div className="flex items-center text-primary font-bold text-sm">
                        Read Report <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 bg-card rounded-2xl border border-dashed">
                <p className="text-muted-foreground font-medium">No recent updates.</p>
              </div>
            )}
          </div>
          <div className="mt-8 sm:hidden flex justify-center">
            <Link href="/news" className={buttonVariants({ variant: "outline", className: "w-full font-bold" })}>
              View All Updates
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6">Ready to assume responsibility?</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10 font-medium">
            Registration is strictly handled by Village Coordinators. Check if your village is participating and contact a coordinator to begin screening.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className={buttonVariants({ size: "lg", className: "h-14 px-8 text-base font-bold bg-accent text-primary hover:bg-accent/90" })}>
              Find Your Coordinator
            </Link>
            <Link href="/about" className={buttonVariants({ variant: "outline", size: "lg", className: "h-14 px-8 text-base font-bold border-white/20 text-white hover:bg-white/10 hover:text-white" })}>
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
