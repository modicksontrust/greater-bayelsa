import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, MessageSquare, Facebook, Instagram, Twitter } from "lucide-react";
import { FaWhatsapp, FaTelegramPlane } from "react-icons/fa";

export function Contact() {
  return (
    <div className="animate-in-stagger pb-20">
      <div className="bg-muted/30 py-16 md:py-24 border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-6">Contact Us</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Have questions about membership, opportunities, or our initiatives? We are here to help. Reach out to the headquarters.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-border/50 shadow-sm text-center p-6">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-bold font-serif text-lg mb-2">Headquarters</h3>
              <p className="text-muted-foreground text-sm">
                Greater Bayelsa Secretariat<br />
                Yenagoa, Bayelsa State<br />
                Nigeria
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-sm text-center p-6">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="font-bold font-serif text-lg mb-2">Phone Lines</h3>
              <p className="text-muted-foreground text-sm mb-1">
                +234 (0) 800 BAYELSA
              </p>
              <p className="text-muted-foreground text-sm">
                Mon - Fri, 9am - 5pm
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm text-center p-6">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-bold font-serif text-lg mb-2">Email Address</h3>
              <p className="text-muted-foreground text-sm mb-1">
                info@greaterbayelsa.org
              </p>
              <p className="text-muted-foreground text-sm">
                support@greaterbayelsa.org
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto mt-20">
          <div className="bg-card border border-border shadow-sm rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl font-bold font-serif mb-6">Connect on Social Media</h2>
            <p className="text-muted-foreground mb-8">
              Stay updated with our latest activities, announcements, and opportunities by following our official channels.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#" className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors font-medium">
                <Facebook className="h-5 w-5" /> Facebook
              </a>
              <a href="#" className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/5 dark:bg-white/10 text-foreground hover:bg-black/10 dark:hover:bg-white/20 transition-colors font-medium">
                <Twitter className="h-5 w-5" /> X (Twitter)
              </a>
              <a href="#" className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F]/20 transition-colors font-medium">
                <Instagram className="h-5 w-5" /> Instagram
              </a>
              <a href="#" className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors font-medium">
                <FaWhatsapp className="h-5 w-5" /> WhatsApp
              </a>
              <a href="#" className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition-colors font-medium">
                <FaTelegramPlane className="h-5 w-5" /> Telegram
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}