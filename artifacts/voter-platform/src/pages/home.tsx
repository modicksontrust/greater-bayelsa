import { Link } from "wouter";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRight, Users, Shield, BookOpen, GraduationCap, Building2 } from "lucide-react";
import { Show } from "@clerk/react";

export function Home() {
  return (
    <div className="animate-in-stagger pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero.jpg`} 
            alt="Community gathering" 
            className="w-full h-full object-cover object-center mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sidebar via-sidebar/90 to-sidebar/40" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 md:px-6 py-24 md:py-32 lg:py-40">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center rounded-full border border-sidebar-primary/30 bg-sidebar-primary/10 px-3 py-1 text-sm font-medium text-sidebar-primary">
              <span className="flex h-2 w-2 rounded-full bg-sidebar-primary mr-2"></span>
              Grassroots NGO in Bayelsa State
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-serif leading-tight">
              Empowering Ordinary People for <span className="text-sidebar-primary">Extraordinary Change</span>
            </h1>
            <p className="text-lg md:text-xl text-sidebar-foreground/80 max-w-xl leading-relaxed">
              Greater Bayelsa is a movement dedicated to self-development, political participation, and the re-orientation of our communities across all 8 LGAs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Show when="signed-out">
                <Link href="/sign-up" className={buttonVariants({ size: "lg", className: "h-14 px-8 text-base font-bold gap-2" })}>
                  Join the Movement <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/about" className={buttonVariants({ size: "lg", variant: "outline", className: "h-14 px-8 text-base bg-transparent border-white/20 hover:bg-white/10 text-white" })}>
                  Learn More
                </Link>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "h-14 px-8 text-base font-bold gap-2" })}>
                  Enter Member Portal <ArrowRight className="h-5 w-5" />
                </Link>
              </Show>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-foreground">Our Core Values</h2>
            <p className="text-muted-foreground text-lg">
              The foundation of everything we do, guiding our mission to uplift every citizen in Bayelsa.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {[
              { label: "Peace", icon: Shield },
              { label: "Unity", icon: Users },
              { label: "Integrity", icon: BookOpen },
              { label: "Courage", icon: Building2 },
              { label: "Patriotism", icon: GraduationCap },
            ].map((value, i) => (
              <div key={i} className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif font-bold text-lg">{value.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                <img 
                  src={`${import.meta.env.BASE_URL}images/community.jpg`}
                  alt="Community members"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 border border-primary/20 rounded-2xl mix-blend-overlay"></div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-foreground">Membership Benefits</h2>
                <p className="text-muted-foreground text-lg">
                  When you join Greater Bayelsa, you become part of a family that looks out for its own. We provide tangible support to help our members thrive.
                </p>
              </div>
              
              <ul className="space-y-6">
                {[
                  { title: "Subsidized Health Insurance", desc: "Access to quality healthcare without the financial burden." },
                  { title: "Job & Scholarship Access", desc: "Priority notifications and recommendations for opportunities." },
                  { title: "Interest-Free Loans", desc: "Support for small businesses and personal development." },
                  { title: "Free Trainings", desc: "Skill acquisition programs to make you globally competitive." },
                ].map((benefit, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold font-serif mb-1">{benefit.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              
              <Show when="signed-out">
                <Link href="/sign-up" className={buttonVariants({ className: "mt-4 font-bold" })}>
                  Register as a Member Today
                </Link>
              </Show>
            </div>
          </div>
        </div>
      </section>

      {/* Structure Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">Our Structure</h2>
            <p className="text-muted-foreground text-lg">
              Organized to ensure every voice is heard, from the grassroots up. We maintain a 5-level leadership structure across the state.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connecting line */}
            <div className="absolute left-[27px] md:left-1/2 top-4 bottom-4 w-1 bg-border/50 md:-translate-x-1/2"></div>
            
            <div className="space-y-12 relative z-10">
              {[
                { title: "Central Board", desc: "The highest decision-making body steering the organization's vision." },
                { title: "DG & HQ", desc: "Director General and headquarters staff managing state-wide operations." },
                { title: "LGA Coordinators", desc: "Leadership across all 8 Local Government Areas of Bayelsa." },
                { title: "Ward Coordinators", desc: "Grassroots mobilization and administration in every ward." },
                { title: "Unit Coordinators", desc: "The foundation of our movement, organizing at the polling unit level." }
              ].map((level, i) => (
                <div key={i} className={`flex flex-col md:flex-row items-start md:items-center gap-6 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`hidden md:block w-1/2 ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
                    <h3 className="text-2xl font-bold font-serif mb-2">{level.title}</h3>
                    <p className="text-muted-foreground">{level.desc}</p>
                  </div>
                  
                  <div className="flex-shrink-0 h-14 w-14 rounded-full border-4 border-background bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md mx-0 md:mx-auto z-10 relative">
                    {i + 1}
                  </div>
                  
                  <div className="md:hidden">
                    <h3 className="text-xl font-bold font-serif mb-1">{level.title}</h3>
                    <p className="text-muted-foreground text-sm">{level.desc}</p>
                  </div>
                  
                  <div className="hidden md:block w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6">Ready to Build a Greater Bayelsa?</h2>
          <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Join thousands of ordinary citizens working together to create extraordinary change in our communities.
          </p>
          <Show when="signed-out">
            <Link href="/sign-up" className={buttonVariants({ size: "lg", variant: "secondary", className: "h-14 px-10 text-lg font-bold" })}>
              Become a Member
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "secondary", className: "h-14 px-10 text-lg font-bold gap-2" })}>
              Go to Dashboard <ArrowRight className="h-5 w-5" />
            </Link>
          </Show>
        </div>
      </section>
    </div>
  );
}