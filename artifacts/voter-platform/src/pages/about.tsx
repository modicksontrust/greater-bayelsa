import { Link } from "wouter";
import { Button, buttonVariants } from "@/components/ui/button";

export function About() {
  return (
    <div className="animate-in-stagger pb-20">
      <div className="bg-muted/30 py-16 md:py-24 border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-6">About Greater Bayelsa</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We are an indigenous grassroots non-governmental organization dedicated to the re-orientation, self-development, and political participation of ordinary people in Bayelsa State.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold font-serif mb-4 text-primary">Who We Are</h2>
              <div className="prose prose-lg text-muted-foreground max-w-none">
                <p>
                  Greater Bayelsa was born out of a profound need for a civic institution that truly represents the interests of the ordinary citizens across the 8 Local Government Areas of our state. We are not a political party, but a movement of conscious individuals who believe that the future of Bayelsa lies in the hands of its people.
                </p>
                <p>
                  We are rooted in our communities, understanding the unique challenges and opportunities that exist in every ward and polling unit. Our strength lies in our numbers and our unwavering commitment to our core values.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-serif mb-4 text-primary">What We Do</h2>
              <div className="prose prose-lg text-muted-foreground max-w-none">
                <p>
                  Our work focuses on three main pillars:
                </p>
                <ul>
                  <li><strong>Re-orientation:</strong> Changing the mindset of our people from dependency to self-reliance, and from apathy to active civic engagement.</li>
                  <li><strong>Self-development:</strong> Providing tangible opportunities for skill acquisition, education, and economic empowerment.</li>
                  <li><strong>Political Participation:</strong> Educating voters, mobilizing for good governance, and ensuring that the voice of the grassroots is heard in the corridors of power.</li>
                </ul>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-card p-8 rounded-2xl border border-border shadow-sm">
              <h2 className="text-2xl font-bold font-serif mb-6 text-foreground">What You Must Know</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">Membership is a Commitment</h3>
                  <p className="text-muted-foreground">Joining Greater Bayelsa means committing to the betterment of your community. It is not just about the benefits you receive, but the value you add.</p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">We Stand for Integrity</h3>
                  <p className="text-muted-foreground">We do not tolerate corruption, violence, or any action that brings disrepute to the organization or the state.</p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Local Action, State Impact</h3>
                  <p className="text-muted-foreground">Every member belongs to a specific Polling Unit and Ward. Your primary responsibility is to be an agent of positive change in your immediate locality.</p>
                </div>
              </div>
            </section>

            <section className="bg-primary/5 p-8 rounded-2xl border border-primary/20">
              <h2 className="text-2xl font-bold font-serif mb-6 text-primary">Obligations of Members</h2>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>Uphold the core values of Peace, Unity, Integrity, Courage, and Patriotism.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>Attend unit and ward meetings regularly.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>Participate actively in all electoral and civic duties (you must have a valid VIN).</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>Pay prescribed dues or levies (if applicable to your membership category).</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
        
        <div className="mt-20 text-center">
          <Link href="/sign-up" className={buttonVariants({ size: "lg", className: "h-14 px-8 text-base font-bold" })}>
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
}