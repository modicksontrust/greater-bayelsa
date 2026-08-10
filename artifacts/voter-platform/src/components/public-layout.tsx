import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Menu, UserCircle, LogIn, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Show, useClerk } from "@clerk/react";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  
  const navItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "News & Updates", path: "/news" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background selection:bg-primary/20">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-primary p-1.5 rounded-lg overflow-hidden flex items-center justify-center h-10 w-10 shrink-0">
              <img
                src={`${import.meta.env.BASE_URL}logo.svg`}
                alt="Greater Bayelsa"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif tracking-tight text-foreground group-hover:text-primary transition-colors">
                Greater Bayelsa
              </h1>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`text-sm font-semibold transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Show when="signed-out">
              <Link href="/sign-in" className={buttonVariants({ variant: "ghost", className: "font-semibold" })}>
                Sign In
              </Link>
              <Link href="/sign-up" className={buttonVariants({ className: "font-bold shadow-sm" })}>
                Join Movement
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className={buttonVariants({ variant: "outline", className: "font-semibold gap-2 border-primary/20 text-primary hover:bg-primary/5" })}>
                <UserCircle className="h-4 w-4" /> Member Portal
              </Link>
            </Show>
          </div>

          {/* Mobile Nav */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm flex flex-col pt-12">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Links to pages</SheetDescription>
              <nav className="flex flex-col gap-6 text-lg font-serif">
                {navItems.map((item) => {
                  const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                  return (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      className={`block transition-colors hover:text-primary ${
                        isActive ? "text-primary font-bold" : "text-foreground font-medium"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto flex flex-col gap-4 pb-8">
                <Show when="signed-out">
                  <Link href="/sign-in" className={buttonVariants({ variant: "outline", className: "w-full justify-start text-lg h-12" })}>
                    Sign In
                  </Link>
                  <Link href="/sign-up" className={buttonVariants({ className: "w-full justify-start text-lg h-12" })}>
                    Join Movement
                  </Link>
                </Show>
                <Show when="signed-in">
                  <Link href="/dashboard" className={buttonVariants({ className: "w-full justify-start text-lg h-12 gap-2" })}>
                    <UserCircle className="h-5 w-5" /> Member Portal
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-lg h-12 text-muted-foreground"
                    onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || "/" })}
                  >
                    Sign Out
                  </Button>
                </Show>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border bg-sidebar pt-16 pb-8 text-sidebar-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3 opacity-90">
                <div className="bg-white p-1 rounded overflow-hidden flex items-center justify-center h-8 w-8 shrink-0">
                  <img
                    src={`${import.meta.env.BASE_URL}logo.svg`}
                    alt="Greater Bayelsa"
                    className="h-full w-full object-contain filter invert"
                  />
                </div>
                <h2 className="text-xl font-bold font-serif">Greater Bayelsa</h2>
              </div>
              <p className="text-sidebar-foreground/70 max-w-sm text-sm leading-relaxed">
                An indigenous grassroots NGO dedicated to the re-orientation, self-development, and political participation of ordinary people across Bayelsa State.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4 font-serif text-sidebar-primary">Quick Links</h3>
              <ul className="space-y-3 text-sm text-sidebar-foreground/80">
                <li><Link href="/about" className="hover:text-white transition-colors">About the Movement</Link></li>
                <li><Link href="/news" className="hover:text-white transition-colors">News & Opportunities</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/sign-up" className="hover:text-white transition-colors">Become a Member</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 font-serif text-sidebar-primary">Legal</h3>
              <ul className="space-y-3 text-sm text-sidebar-foreground/80">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Membership Code</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-sidebar-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-sidebar-foreground/50">
            <p>&copy; {new Date().getFullYear()} Greater Bayelsa. All rights reserved.</p>
            <p>Built with purpose for the people of Bayelsa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}