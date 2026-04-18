import photo2 from "@/assets/salon/photo2.jpg";
import photo3 from "@/assets/salon/photo3.jpg";
import photo4 from "@/assets/salon/photo4.jpg";

export function About() {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="grid grid-cols-2 gap-4">
          <img
            src={photo2}
            alt="Χτένισμα κομμωτηρίου"
            className="rounded-2xl shadow-elegant h-72 w-full object-cover hover-lift"
          />
          <img
            src={photo3}
            alt="Εσωτερικό κομμωτηρίου"
            className="rounded-2xl shadow-elegant h-72 w-full object-cover hover-lift mt-8"
          />
          <img
            src={photo4}
            alt="Λεπτομέρεια κομμωτηρίου"
            className="rounded-2xl shadow-elegant h-72 w-full object-cover hover-lift col-span-2"
          />
        </div>

        <div className="space-y-6">
          <p className="text-xs tracking-[0.4em] uppercase text-primary">Σχετικά με εμάς</p>
          <h2 className="text-4xl md:text-5xl font-serif leading-tight">
            Πάθος για την <span className="text-gradient-gold">τέχνη</span> των μαλλιών
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Στο <strong className="text-foreground">Γιάννης Hair Art</strong>, στο Ίλιον, πιστεύουμε
            ότι κάθε κούρεμα και κάθε βαφή είναι μια προσωπική ιστορία. Με πάνω από 15 χρόνια
            εμπειρίας, συνδυάζουμε σύγχρονες τεχνικές με κλασική φροντίδα για να αναδείξουμε τη
            φυσική σου ομορφιά.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Χρησιμοποιούμε επώνυμα προϊόντα υψηλής ποιότητας, σεβόμαστε την υγεία της τρίχας και
            σχεδιάζουμε look που σε αντιπροσωπεύει — είτε ψάχνεις μια φρέσκια αλλαγή, είτε ένα
            εντυπωσιακό βραδινό χτένισμα.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div>
              <div className="text-3xl font-serif text-gradient-gold">15+</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Χρόνια</div>
            </div>
            <div>
              <div className="text-3xl font-serif text-gradient-gold">2K+</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Πελάτες</div>
            </div>
            <div>
              <div className="text-3xl font-serif text-gradient-gold">100%</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Μεράκι</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
