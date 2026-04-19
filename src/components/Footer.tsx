import { Scissors, Heart, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-gradient-dark border-t border-border py-10">
      <div className="container mx-auto px-6 grid gap-6 md:grid-cols-3 items-center">
        <div className="flex items-center gap-2 justify-center md:justify-start">
          <Scissors className="h-5 w-5 text-primary" />
          <div>
            <span className="font-serif text-gradient-gold">Γιάννης</span>{" "}
            <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Hair Art
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Γιάννης Hair Art · Με επιφύλαξη παντός δικαιώματος
        </p>

        <p className="text-sm text-muted-foreground text-center md:text-right flex items-center justify-center md:justify-end gap-1.5">
          Made with <Heart className="h-3.5 w-3.5 text-primary fill-primary animate-pulse" /> by{" "}
          <a
            href="https://www.instagram.com/leon1dacc/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground font-medium story-link hover:text-primary transition-smooth"
          >
            leon1dacc
          </a>
        </p>
      </div>
      <div className="container mx-auto px-6 mt-4 text-center">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-primary transition-smooth"
        >
          <Lock className="h-3 w-3" /> Admin
        </Link>
      </div>
    </footer>
  );
}
