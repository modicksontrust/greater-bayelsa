import { PublicLayout } from "@/components/public-layout";
import { useListVillages } from "@workspace/api-client-react";
import { ShieldCheck, MapPin, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Leaders() {
  const { data: villages, isLoading } = useListVillages({
    query: { queryKey: ["/api/villages"] }
  });

  return (
    <PublicLayout>
      <div className="bg-muted/30 pt-16 pb-20 border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center animate-in-stagger">
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 tracking-tight">Institutional Leaders</h1>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
              Vetted and accountable coordinators managing our grassroots pipeline.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card rounded-2xl border p-6">
                <div className="flex gap-4 mb-6">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {villages?.map((village) => (
              <div key={village.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="p-6 border-b bg-muted/10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-bold font-serif text-lg">{village.name}</span>
                    </div>
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      Village Head
                    </div>
                  </div>
                  
                  {village.coordinator ? (
                    <div className="flex gap-4 items-center">
                      {village.coordinator.photoUrl ? (
                        <img 
                          src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${village.coordinator.photoUrl}`}
                          alt={village.coordinator.firstName}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-background shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-xl text-primary border-2 border-background shadow-sm">
                          {village.coordinator.firstName[0]}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{village.coordinator.firstName} {village.coordinator.lastName}</h3>
                        {village.coordinator.vettingStatus === "verified" && (
                          <div className="flex items-center text-emerald-600 text-xs font-bold mt-1">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Vetted & Verified
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground font-medium py-4">
                      Pending Appointment
                    </div>
                  )}
                </div>
                
                {village.coordinator && (
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4 flex-1">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Biography</h4>
                      <p className="text-sm leading-relaxed text-foreground/80 line-clamp-4">
                        {village.coordinator.bio || "No biography provided."}
                      </p>
                    </div>
                    {village.coordinator.credentials && (
                      <div className="bg-muted p-3 rounded-lg border">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center">
                          <Award className="h-3 w-3 mr-1" /> Credentials
                        </h4>
                        <p className="text-sm font-medium">{village.coordinator.credentials}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
