import { Scissors, Palette } from "lucide-react";

const services = [
  {
    icon: Scissors,
    title: "Κούρεμα",
    desc: "Γυναικείο & ανδρικό κούρεμα προσαρμοσμένο στο πρόσωπο και το στυλ σου.",
    price: "10€",
  },
  {
    icon: Palette,
    title: "Βαφή Μαλλιών",
    desc: "Επαγγελματικές βαφές με προϊόντα υψηλής ποιότητας για λαμπερό αποτέλεσμα.",
    price: "20€",
  },
];

export function Services() {
  return (
    <section id="services" className="py-24 bg-gradient-dark">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Οι Υπηρεσίες μας</p>
          <h2 className="text-4xl md:text-5xl font-serif mb-4">
            Ομορφιά <span className="text-gradient-gold">σχεδιασμένη</span> για σένα
          </h2>
          <p className="text-muted-foreground">
            Από κλασικά κουρέματα μέχρι σύγχρονες τεχνικές χρωματισμού.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {services.map((s, i) => (
            <div
              key={s.title}
              className="group relative bg-card border border-border rounded-2xl p-6 hover-lift"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center mb-5 group-hover:scale-110 transition-smooth">
                <s.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-serif mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 min-h-[60px]">{s.desc}</p>
              <div className="text-primary font-medium">{s.price}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
