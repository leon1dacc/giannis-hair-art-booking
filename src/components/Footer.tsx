import { Scissors } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-dark border-t border-border py-10">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          <div>
            <span className="font-serif text-gradient-gold">Γιάννης</span>{" "}
            <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Hair Art
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Γιάννης Hair Art · Πετρουπόλεως 62, Ίλιον
        </p>
      </div>
    </footer>
  );
}
