import { MapPin, Phone, Clock } from "lucide-react";

const hours = [
  { day: "Δευτέρα", time: "Κλειστά", closed: true },
  { day: "Τρίτη", time: "09:00–14:00 · 17:00–20:30" },
  { day: "Τετάρτη", time: "09:00–14:00" },
  { day: "Πέμπτη", time: "09:00–14:00 · 17:00–20:30" },
  { day: "Παρασκευή", time: "09:00–14:00 · 17:00–20:30" },
  { day: "Σάββατο", time: "09:00–17:00" },
  { day: "Κυριακή", time: "Κλειστά", closed: true },
];

export function Contact() {
  return (
    <section id="contact" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Επικοινωνία</p>
          <h2 className="text-4xl md:text-5xl font-serif mb-4">
            Έλα να μας <span className="text-gradient-gold">γνωρίσεις</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <InfoCard icon={MapPin} title="Διεύθυνση">
            <p>Πετρουπόλεως 62</p>
            <p>Ίλιον 131 23</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Πετρουπόλεως+62+Ίλιον"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-primary hover:underline text-sm"
            >
              Άνοιξε στους χάρτες →
            </a>
          </InfoCard>

          <InfoCard icon={Phone} title="Τηλέφωνο">
            <a
              href="tel:+302102627102"
              className="text-lg text-foreground hover:text-primary transition-smooth"
            >
              21 0262 7102
            </a>
            <p className="text-sm text-muted-foreground mt-2">
              Καλέσε μας για άμεση εξυπηρέτηση
            </p>
          </InfoCard>

          <InfoCard icon={Clock} title="Ωράριο">
            <ul className="space-y-1 text-sm">
              {hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{h.day}</span>
                  <span className={h.closed ? "text-destructive" : "text-foreground"}>
                    {h.time}
                  </span>
                </li>
              ))}
            </ul>
          </InfoCard>
        </div>

        <div className="rounded-3xl overflow-hidden border border-border shadow-elegant h-[400px]">
          <iframe
            title="Χάρτης Γιάννης Hair Art"
            src="https://www.google.com/maps?q=Πετρουπόλεως+62,+Ίλιον+131+23&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0, filter: "invert(0.9) hue-rotate(180deg)" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-7 hover-lift">
      <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center mb-5">
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="text-xl font-serif mb-3">{title}</h3>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
