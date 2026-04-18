import { useState, useEffect } from "react";
import { Menu, X, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#home", label: "Αρχική" },
  { href: "#services", label: "Υπηρεσίες" },
  { href: "#about", label: "Σχετικά" },
  { href: "#booking", label: "Ραντεβού" },
  { href: "#contact", label: "Επικοινωνία" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-smooth",
        scrolled
          ? "bg-background/85 backdrop-blur-lg border-b border-border shadow-elegant"
          : "bg-transparent",
      )}
    >
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        <a href="#home" className="flex items-center gap-2 group">
          <Scissors className="h-6 w-6 text-primary transition-smooth group-hover:rotate-12" />
          <div className="leading-tight">
            <div className="font-serif text-xl text-gradient-gold">Γιάννης</div>
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              Hair Art
            </div>
          </div>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-foreground/80 hover:text-primary transition-smooth relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-px after:bg-primary after:transition-all hover:after:w-full"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#booking"
          className="hidden md:inline-flex items-center px-5 py-2 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium hover-lift"
        >
          Κλείσε Ραντεβού
        </a>

        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border animate-fade-in">
          <ul className="flex flex-col p-6 gap-4">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block text-foreground/80 hover:text-primary transition-smooth"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <a
              href="#booking"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium"
            >
              Κλείσε Ραντεβού
            </a>
          </ul>
        </div>
      )}
    </header>
  );
}
