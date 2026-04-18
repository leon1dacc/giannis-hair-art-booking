import { useState } from "react";
import { Calendar, Clock, User, Phone, Check } from "lucide-react";
import { toast } from "sonner";

const services = ["Κούρεμα", "Βαφή Μαλλιών", "Ανταύγειες", "Χτένισμα", "Θεραπεία"];
const times = [
  "09:00", "10:00", "11:00", "12:00", "13:00",
  "17:00", "18:00", "19:00", "20:00",
];

export function Booking() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    service: services[0],
    date: "",
    time: times[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date) {
      toast.error("Παρακαλώ συμπλήρωσε όλα τα πεδία");
      return;
    }
    setSubmitted(true);
    toast.success("Το αίτημα ραντεβού στάλθηκε! Θα επικοινωνήσουμε σύντομα.");
  };

  return (
    <section id="booking" className="py-24 bg-gradient-dark">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Ραντεβού</p>
          <h2 className="text-4xl md:text-5xl font-serif mb-4">
            Κλείσε το <span className="text-gradient-gold">ραντεβού</span> σου
          </h2>
          <p className="text-muted-foreground">
            Συμπλήρωσε τη φόρμα και θα επιβεβαιώσουμε άμεσα.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-8 md:p-10 shadow-elegant">
          {submitted ? (
            <div className="text-center py-12 animate-fade-up">
              <div className="w-16 h-16 rounded-full bg-gradient-gold mx-auto flex items-center justify-center mb-6">
                <Check className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-serif mb-2">Ευχαριστούμε, {form.name}!</h3>
              <p className="text-muted-foreground mb-6">
                Λάβαμε το αίτημα σου για <strong className="text-primary">{form.service}</strong> στις{" "}
                <strong className="text-primary">{form.date}</strong> στις{" "}
                <strong className="text-primary">{form.time}</strong>.<br />
                Θα σε καλέσουμε στο {form.phone} για επιβεβαίωση.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", phone: "", service: services[0], date: "", time: times[0] });
                }}
                className="text-primary hover:underline"
              >
                Νέο ραντεβού
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
              <Field icon={User} label="Όνομα">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-smooth"
                  placeholder="Το όνομά σου"
                />
              </Field>

              <Field icon={Phone} label="Τηλέφωνο">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-smooth"
                  placeholder="69XXXXXXXX"
                />
              </Field>

              <Field icon={Check} label="Υπηρεσία" full>
                <select
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-smooth"
                >
                  {services.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>

              <Field icon={Calendar} label="Ημερομηνία">
                <input
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-smooth"
                />
              </Field>

              <Field icon={Clock} label="Ώρα">
                <select
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-smooth"
                >
                  {times.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>

              <button
                type="submit"
                className="md:col-span-2 mt-2 px-7 py-4 rounded-full bg-gradient-gold text-primary-foreground font-medium hover-lift"
              >
                Επιβεβαίωση Ραντεβού
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  icon: Icon,
  label,
  children,
  full,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </label>
      {children}
    </div>
  );
}
