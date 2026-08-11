import { useState, useRef, useEffect } from "react";
import { PublicLayout } from "@/components/public-layout";
import { useListVillages, useScreeningChat } from "@workspace/api-client-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Users, MessageSquare, Send, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function Register() {
  const { data: villages, isLoading } = useListVillages({
    query: { queryKey: ["/api/villages"] }
  });

  const [selectedVillage, setSelectedVillage] = useState<number | null>(null);

  return (
    <PublicLayout>
      <div className="bg-muted/30 pt-16 pb-20 border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center animate-in-stagger">
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6 tracking-tight">Register for Membership</h1>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium mb-8">
              Select your village below to contact a coordinator. You will go through an initial automated screening to verify eligibility.
            </p>
            <div className="inline-flex items-center text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
              <ShieldAlert className="h-4 w-4 mr-2" /> Self-registration is strictly prohibited.
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-card rounded-2xl border p-6">
                <Skeleton className="h-6 w-1/2 mb-4" />
                <Skeleton className="h-4 w-1/3 mb-6" />
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {villages?.map((village) => (
              <div key={village.id} className="bg-card rounded-2xl border shadow-sm p-6 flex flex-col hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold font-serif flex items-center">
                      <MapPin className="h-5 w-5 text-primary mr-2" />
                      {village.name}
                    </h3>
                    <p className="text-muted-foreground text-sm font-medium mt-1 flex items-center">
                      <Users className="h-4 w-4 mr-1" /> {village.memberCount} Members
                    </p>
                  </div>
                </div>
                
                <div className="flex-1">
                  {village.coordinator ? (
                    <div className="flex gap-4 items-center bg-muted/30 p-3 rounded-xl border border-border/50 mb-6">
                      {village.coordinator.photoUrl ? (
                        <img 
                          src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${village.coordinator.photoUrl}`}
                          alt={village.coordinator.firstName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border-2 border-background shadow-sm">
                          {village.coordinator.firstName[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Coordinator</p>
                        <p className="font-bold text-sm">{village.coordinator.firstName} {village.coordinator.lastName}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 p-3 rounded-xl border border-dashed border-border/50 mb-6 text-center">
                      <p className="text-sm font-medium text-muted-foreground">Coordinator Pending</p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => setSelectedVillage(village.id)}
                  
                  className="w-full font-bold shadow-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Coordinator
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScreeningDialog 
        villageId={selectedVillage} 
        onClose={() => setSelectedVillage(null)} 
        villageName={villages?.find(v => v.id === selectedVillage)?.name}
        coordinatorName={
          villages?.find(v => v.id === selectedVillage)?.coordinator 
            ? `${villages?.find(v => v.id === selectedVillage)?.coordinator?.firstName} ${villages?.find(v => v.id === selectedVillage)?.coordinator?.lastName}`
            : undefined
        }
      />
    </PublicLayout>
  );
}

type Message = { role: "user" | "assistant", content: string };

function ScreeningDialog({ 
  villageId, 
  onClose,
  villageName,
  coordinatorName
}: { 
  villageId: number | null, 
  onClose: () => void,
  villageName?: string,
  coordinatorName?: string
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const chatMutation = useScreeningChat();

  // Reset when opened
  useEffect(() => {
    if (villageId) {
      setMessages([{
        role: "assistant", 
        content: `Welcome to the ${villageName} screening. I am the AI assistant for Coordinator ${coordinatorName}. Before I connect you, I need to verify your eligibility. Are you a registered voter in this village? What is your full name?`
      }]);
      setEligible(null);
      setWhatsappUrl(null);
      setInput("");
    }
  }, [villageId, villageName, coordinatorName]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !villageId || chatMutation.isPending || eligible !== null) return;

    const newMsg: Message = { role: "user", content: input };
    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    setInput("");

    chatMutation.mutate({
      data: {
        villageId,
        messages: nextMessages
      }
    }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        if (data.eligible !== null) {
          setEligible(data.eligible);
          if (data.whatsappUrl) {
            setWhatsappUrl(data.whatsappUrl);
          }
        }
      }
    });
  };

  return (
    <Dialog open={villageId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 border-b bg-card">
          <DialogTitle className="font-serif text-xl">Screening Chat</DialogTitle>
          <DialogDescription>
            {villageName} • Coordinator {coordinatorName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-card border rounded-tl-sm text-foreground shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-card border p-4 rounded-2xl rounded-tl-sm flex gap-1 items-center shadow-sm">
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          )}

          {/* Outcome States */}
          {eligible === true && (
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-emerald-900 mb-2">Preliminary Verification Successful</h3>
              <p className="text-emerald-700 text-sm mb-6">
                You appear to meet the criteria. Proceed to contact the coordinator for final verification and enrollment.
              </p>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ className: "w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold" })}>
                  Continue on WhatsApp <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {eligible === false && (
            <div className="mt-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-destructive mb-2">Eligibility Not Met</h3>
              <p className="text-destructive/80 text-sm">
                Based on your responses, you do not meet the criteria for Phase One membership at this time. Thank you for your interest in Greater Bayelsa.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-card border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={eligible !== null ? "Chat concluded." : "Type your message..."}
              disabled={eligible !== null || chatMutation.isPending}
              className="rounded-xl h-12 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-12 w-12 rounded-xl shrink-0 bg-primary hover:bg-primary/90 shadow-sm"
              disabled={!input.trim() || eligible !== null || chatMutation.isPending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
