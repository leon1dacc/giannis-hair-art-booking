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

  // Lock scroll when menu open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNav = (href: string) => {
    setOpen(false);
    setTimeout(() => {
      const id = href.replace("#", "");
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-smooth",
          scrolled
            ? "bg-background/85 backdrop-blur-lg border-b border-border shadow-elegant"
            : "bg-transparent",
        )}
      >
        <nav className="container mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => handleNav("#home")}
            className="flex items-center gap-2 group"
            aria-label="Αρχική"
          >
            <Scissors className="h-6 w-6 text-primary transition-smooth group-hover:rotate-12" />
            <div className="leading-tight text-left">
              <div className="font-serif text-xl text-gradient-gold">Γιάννης</div>
              <div className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
                Hair Art
              </div>
            </div>
          </button>

          <ul className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <button
                  onClick={() => handleNav(l.href)}
                  className="text-sm text-foreground/80 hover:text-primary transition-smooth relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-px after:bg-primary after:transition-all hover:after:w-full"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleNav("#booking")}
            className="hidden md:inline-flex items-center px-5 py-2 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium hover-lift"
          >
            Κλείσε Ραντεβού
          </button>

          <button
            className="md:hidden text-foreground z-[60] relative"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Κλείσιμο μενού" : "Άνοιγμα μενού"}
          >
            <div className="relative w-6 h-6">
              <Menu
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  open ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100",
                )}
              />
              <X
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  open ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50",
                )}
              />
            </div>
          </button>
        </nav>
      </header>

      {/* Mobile slide-in menu */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-40 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute top-0 right-0 h-full w-[78%] max-w-sm bg-gradient-dark border-l border-border shadow-elegant transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex flex-col h-full pt-24 px-8">
            <ul className="flex flex-col gap-2">
              {links.map((l, i) => (
                <li
                  key={l.href}
                  style={{ transitionDelay: open ? `${i * 60 + 100}ms` : "0ms" }}
                  className={cn(
                    "transition-all duration-500",
                    open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
                  )}
                >
                  <button
                    onClick={() => handleNav(l.href)}
                    className="block w-full text-left py-3 text-2xl font-serif text-foreground/90 hover:text-primary transition-smooth border-b border-border/40"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleNav("#booking")}
              style={{ transitionDelay: open ? `${links.length * 60 + 100}ms` : "0ms" }}
              className={cn(
                "mt-8 inline-flex items-center justify-center px-5 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium transition-all duration-500",
                open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
              )}
            >
              Κλείσε Ραντεβού
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
