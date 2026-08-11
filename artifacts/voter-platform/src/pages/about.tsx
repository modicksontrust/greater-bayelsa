import { PublicLayout } from "@/components/public-layout";
import { Network, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";

export function About() {
  return (
    <PublicLayout>
      <div className="bg-muted/30 pt-16 pb-24 border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center animate-in-stagger">
            <h1 className="text-4xl md:text-6xl font-bold font-serif mb-6 tracking-tight">The Institution</h1>
            <p className="text-xl text-muted-foreground leading-relaxed font-medium">
              We are a formal civic institution dedicated to structured leadership development in Bayelsa State.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold font-serif">Not a campaign. <br/>Not a charity.</h2>
            <div className="w-16 h-1 bg-accent rounded"></div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Greater Bayelsa operates on the principle that true civic development requires rigorous structure, accountability, and vetting. 
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are building a pipeline of leaders who understand their communities deeply, are known by their peers, and commit to institutional standards rather than temporary political mobilization.
            </p>
          </div>
          <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-sm">
            <h3 className="text-2xl font-bold font-serif mb-8 text-center">Institutional Hierarchy</h3>
            <div className="space-y-6 relative before:absolute before:inset-y-4 before:left-8 before:w-px before:bg-border">
              {[
                { name: "Zone Level", desc: "Strategic oversight across multiple districts" },
                { name: "District Level", desc: "Coordination of constituent villages" },
                { name: "Village Level", desc: "Led by Village Heads, organizing the community" },
                { name: "Unit Level", desc: "The foundational block, led by Unit Leaders" }
              ].map((level, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="w-16 flex-shrink-0 flex items-center justify-center relative z-10 bg-card py-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-4 ring-card">
                      {4-i}
                    </div>
                  </div>
                  <div className="pt-1.5">
                    <h4 className="font-bold text-lg">{level.name}</h4>
                    <p className="text-muted-foreground text-sm">{level.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-primary rounded-3xl p-8 md:p-16 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
            <Network className="w-96 h-96" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6">The Legitimacy Standard</h2>
            <p className="text-lg text-white/80 leading-relaxed mb-8">
              We do not accept anonymous or unverified members. Every member of Greater Bayelsa must be a verified, registered voter in their respective unit. This ensures that our institution is built on a foundation of legitimate stakeholders who have a documented right to participate in civic duties.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/eligibility" className={buttonVariants({ variant: "outline", className: "bg-transparent border-white/20 hover:bg-white/10 text-white font-bold h-12 px-6" })}>
                <ShieldCheck className="mr-2 h-5 w-5" /> View Criteria
              </Link>
              <Link href="/leaders" className={buttonVariants({ className: "bg-accent text-primary hover:bg-accent/90 font-bold h-12 px-6" })}>
                <UserCheck className="mr-2 h-5 w-5" /> View Leaders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
