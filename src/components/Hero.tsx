import photo1 from "@/assets/salon/photo1.jpg";

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden pt-24"
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-shimmer" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/15 blur-3xl animate-shimmer delay-500" />
      </div>

      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-6">
          <p className="text-xs tracking-[0.4em] uppercase text-primary animate-fade-up">
            Hair Salon · Ίλιον
          </p>
          <h1 className="text-5xl md:text-7xl font-serif leading-[1.05] animate-fade-up delay-100">
            <span className="text-gradient-gold">Γιάννης</span>
            <br />
            <span className="text-foreground">Hair Art</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md animate-fade-up delay-200">
            Κομμωτική & βαφή μαλλιών με αγάπη, εμπειρία και προσοχή στη λεπτομέρεια. Το στυλ σου,
            επανασχεδιασμένο.
          </p>
          <div className="flex flex-wrap gap-4 animate-fade-up delay-300">
            <a
              href="#booking"
              className="inline-flex items-center px-7 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover-lift"
            >
              Κλείσε Ραντεβού
            </a>
            <a
              href="#services"
              className="inline-flex items-center px-7 py-3 rounded-full border border-border text-foreground hover:border-primary hover:text-primary transition-smooth"
            >
              Δες τις Υπηρεσίες
            </a>
          </div>
        </div>

        <div className="relative animate-fade-in delay-300">
          <div className="absolute -inset-4 bg-gradient-gold opacity-20 blur-2xl rounded-3xl" />
          <img
            src={photo1}
            alt="Γιάννης Hair Art κομμωτήριο εσωτερικός χώρος"
            className="relative rounded-3xl shadow-elegant w-full h-[500px] object-cover"
          />
          <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl p-4 shadow-gold">
            <div className="text-3xl font-serif text-gradient-gold">10+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Χρόνια Εμπειρίας
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
