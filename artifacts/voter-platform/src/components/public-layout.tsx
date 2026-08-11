import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Menu, LogIn, Shield, Users, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Show, useClerk } from "@clerk/react";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Leaders", path: "/leaders" },
    { name: "News & Impact", path: "/news" },
    { name: "Eligibility", path: "/eligibility" },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background selection:bg-primary/20">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-w-0 group shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="Greater Bayelsa"
              className="h-9 w-9 object-contain shrink-0"
            />
            <h1 className="text-base md:text-lg font-bold font-serif tracking-tight text-foreground group-hover:text-primary transition-colors leading-none truncate">
              Greater Bayelsa
            </h1>
          </Link>

          {/* Desktop Nav — hidden below md */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7">
            {navItems.map((item) => {
              const isActive =
                location === item.path ||
                (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`text-sm font-semibold transition-colors hover:text-primary whitespace-nowrap ${
                    isActive
                      ? "text-primary border-b-2 border-primary pb-1 -mb-1"
                      : "text-foreground/70"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA — hidden below md */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "font-semibold text-foreground/70 hover:text-primary",
                })}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ size: "sm", className: "font-bold shadow-sm" })}
              >
                Register
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className={buttonVariants({
                  variant: "default",
                  size: "sm",
                  className: "font-semibold shadow-sm",
                })}
              >
                <Shield className="h-3.5 w-3.5 mr-1.5" /> Portal
              </Link>
            </Show>
          </div>

          {/* Mobile: compact CTA + hamburger */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className={buttonVariants({
                  size: "sm",
                  className: "font-bold text-xs px-3",
                })}
              >
                <Shield className="h-3.5 w-3.5 mr-1.5" /> Portal
              </Link>
            </Show>
            <Show when="signed-out">
              <Link
                href="/register"
                className={buttonVariants({
                  size: "sm",
                  className: "font-bold text-xs px-3 hidden xs:flex",
                })}
              >
                Join
              </Link>
            </Show>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-foreground hover:bg-muted"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[80vw] max-w-[320px] flex flex-col p-0 border-l border-border/60"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Site navigation links</SheetDescription>

                {/* Sheet header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5"
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}logo.svg`}
                      alt="Greater Bayelsa"
                      className="h-8 w-8 object-contain shrink-0"
                    />
                    <span className="font-bold font-serif text-sm">Greater Bayelsa</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                  {navItems.map((item) => {
                    const isActive =
                      location === item.path ||
                      (item.path !== "/" && location.startsWith(item.path));
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-foreground font-semibold hover:bg-muted"
                        }`}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                {/* CTA area */}
                <div className="px-4 pb-8 pt-4 border-t border-border/40 flex flex-col gap-3">
                  <Show when="signed-out">
                    <Link
                      href="/sign-in"
                      onClick={() => setOpen(false)}
                      className={buttonVariants({
                        variant: "outline",
                        className: "w-full justify-center font-bold h-12",
                      })}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className={buttonVariants({
                        className: "w-full justify-center font-bold h-12",
                      })}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Register Now
                    </Link>
                  </Show>
                  <Show when="signed-in">
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className={buttonVariants({
                        className: "w-full justify-center font-bold h-12",
                      })}
                    >
                      <Shield className="h-5 w-5 mr-2" /> Member Portal
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-center font-bold h-12 text-muted-foreground"
                      onClick={() => {
                        setOpen(false);
                        signOut({ redirectUrl: import.meta.env.BASE_URL || "/" });
                      }}
                    >
                      Sign Out
                    </Button>
                  </Show>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="bg-[#0f3d26] text-white/90 py-16 border-t-[8px] border-accent">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={`${import.meta.env.BASE_URL}logo.svg`}
                  alt="Greater Bayelsa"
                  className="h-12 w-12 object-contain shrink-0"
                />
                <div>
                  <h2 className="text-2xl font-bold font-serif text-white leading-none">
                    Greater Bayelsa
                  </h2>
                  <p className="text-xs uppercase tracking-widest text-accent font-semibold mt-1">
                    Civic Institution
                  </p>
                </div>
              </div>
              <p className="text-white/70 max-w-sm text-sm leading-relaxed">
                A serious, credible civic institution developing a disciplined leadership pipeline from
                the grassroots of Sagbama Constituency One.
              </p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-bold mb-6 font-serif text-accent uppercase tracking-wider text-sm">
                Institution
              </h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <Link href="/about" className="hover:text-accent transition-colors font-medium">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/leaders" className="hover:text-accent transition-colors font-medium">
                    Leadership
                  </Link>
                </li>
                <li>
                  <Link href="/eligibility" className="hover:text-accent transition-colors font-medium">
                    Eligibility
                  </Link>
                </li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-bold mb-6 font-serif text-accent uppercase tracking-wider text-sm">
                Action
              </h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <Link href="/news" className="hover:text-accent transition-colors font-medium">
                    News & Impact
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-accent transition-colors font-medium">
                    Register Now
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="hover:text-accent transition-colors font-medium">
                    Member Login
                  </Link>
                </li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <h3 className="font-bold mb-6 font-serif text-accent uppercase tracking-wider text-sm">
                Headquarters
              </h3>
              <ul className="space-y-4 text-sm text-white/70">
                <li className="font-medium text-white">Sagbama Constituency One</li>
                <li>Bayelsa State, Nigeria</li>
                <li className="pt-2">
                  <a
                    href="mailto:contact@greaterbayelsa.org"
                    className="hover:text-accent transition-colors"
                  >
                    contact@greaterbayelsa.org
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50 font-medium tracking-wide">
            <p>&copy; {new Date().getFullYear()} Greater Bayelsa. All rights reserved.</p>
            <p>Developing members. Building leaders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
