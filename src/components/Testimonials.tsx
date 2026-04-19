import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Μαρία Π.",
    text: "Φοβερό κούρεμα! Ο Γιάννης ξέρει τι κάνει. Από τότε δεν πάω αλλού.",
    rating: 5,
  },
  {
    name: "Δημήτρης Α.",
    text: "Επαγγελματίας στο 100%. Καθαρό μαγαζί, ωραία ατμόσφαιρα και πάντα συνεπής στα ραντεβού.",
    rating: 5,
  },
  {
    name: "Ελένη Κ.",
    text: "Έκανα βαφή μαλλιών και βγήκε ακριβώς όπως την ήθελα. Το συνιστώ ανεπιφύλακτα!",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 animate-fade-up">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Κριτικές</p>
          <h2 className="text-4xl md:text-5xl font-serif mb-4">
            Τι λένε οι <span className="text-gradient-gold">πελάτες</span> μας
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              style={{ animationDelay: `${i * 120}ms` }}
              className="group relative bg-card border border-border rounded-2xl p-7 shadow-elegant hover-lift animate-fade-up transition-smooth"
            >
              <Quote className="absolute top-5 right-5 h-8 w-8 text-primary/20 group-hover:text-primary/40 transition-smooth" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground/90 mb-5 leading-relaxed">"{t.text}"</p>
              <p className="text-sm text-muted-foreground font-medium">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
