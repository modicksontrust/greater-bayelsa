import { PublicLayout } from "@/components/public-layout";
import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import { CheckCircle2, ShieldAlert, FileSignature, MapPin, ArrowRight } from "lucide-react";

export function Eligibility() {
  return (
    <PublicLayout>
      <div className="bg-primary pt-20 pb-24 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center animate-in-stagger">
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white mb-6 border border-white/20">
              <ShieldAlert className="w-4 h-4 mr-2" /> Strictly Enforced
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-serif mb-6 tracking-tight">Membership Criteria</h1>
            <p className="text-xl text-white/80 leading-relaxed font-medium">
              Greater Bayelsa is not open to everyone. We maintain strict institutional standards to ensure a legitimate and accountable leadership pipeline.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        <div className="max-w-4xl mx-auto">
          
          <div className="bg-card border shadow-sm rounded-3xl p-8 md:p-12 mb-12">
            <h2 className="text-2xl font-bold font-serif mb-8 text-center">Core Requirements</h2>
            
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">1. Geographic Jurisdiction</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You must be a resident or indigene of the six pilot villages within Sagbama Constituency One. Phase One is strictly limited to these pilot areas.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileSignature className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">2. Registered Voter Status</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You must possess a valid Voter Identification Number (VIN) registered within the approved units. <strong>No exceptions.</strong> Our platform cross-checks your VIN against the official roll during enrollment.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">3. Age & Civic Standing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Must be 18 years or older, of sound civic character, and willing to participate in structured monthly meetings and pay symbolic institutional dues.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-3xl p-8 md:p-12 text-center border border-border/50">
            <h3 className="text-2xl font-bold font-serif mb-4">No Self-Registration</h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              We do not provide public sign-up forms. Membership accounts are created exclusively by vetted Village Coordinators after an in-person or AI-assisted screening process.
            </p>
            <Link href="/register" className={buttonVariants({ size: "lg", className: "h-14 px-8 font-bold shadow-sm" })}>
              Start the Screening Process <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
