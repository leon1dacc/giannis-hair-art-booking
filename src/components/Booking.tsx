import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, User, Phone, Check, Scissors } from "lucide-react";
import { toast } from "sonner";

const services = ["Κούρεμα", "Βαφή Μαλλιών"];

// Schedule per weekday (0 = Sunday ... 6 = Saturday)
// Each entry is an array of "HH:MM" slots (hourly).
const SCHEDULE: Record<number, string[]> = {
  0: [], // Κυριακή — Κλειστά
  1: [], // Δευτέρα — Κλειστά
  2: ["09:00", "10:00", "11:00", "12:00", "13:00", "17:00", "18:00", "19:00", "20:00"], // Τρίτη
  3: ["09:00", "10:00", "11:00", "12:00", "13:00"], // Τετάρτη
  4: ["09:00", "10:00", "11:00", "12:00", "13:00", "17:00", "18:00", "19:00", "20:00"], // Πέμπτη
  5: ["09:00", "10:00", "11:00", "12:00", "13:00", "17:00", "18:00", "19:00", "20:00"], // Παρασκευή
  6: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"], // Σάββατο
};

const STORAGE_KEY = "yannis-booked-slots";

function getBookedSlots(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveBookedSlot(date: string, time: string) {
  const all = getBookedSlots();
  all[date] = [...(all[date] || []), time];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function Booking() {
  const [submitted, setSubmitted] = useState(false);
  const [booked, setBooked] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({
    name: "",
    phone: "",
    service: services[0],
    date: "",
    time: "",
  });

  useEffect(() => {
    setBooked(getBookedSlots());
  }, []);

  const today = new Date().toISOString().split("T")[0];

  // Compute available time slots for the chosen date
  const availableTimes = useMemo(() => {
    if (!form.date) return [];
    // Parse YYYY-MM-DD as local date
    const [y, m, d] = form.date.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    const slots = SCHEDULE[dayOfWeek] || [];
    const taken = booked[form.date] || [];
    return slots.filter((s) => !taken.includes(s));
  }, [form.date, booked]);

  const isClosedDay = useMemo(() => {
    if (!form.date) return false;
    const [y, m, d] = form.date.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    return (SCHEDULE[dayOfWeek] || []).length === 0;
  }, [form.date]);

  const handleDateChange = (date: string) => {
    setForm((f) => ({ ...f, date, time: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date) {
      toast.error("Παρακαλώ συμπλήρωσε όλα τα πεδία");
      return;
    }
    if (isClosedDay) {
      toast.error("Το κατάστημα είναι κλειστό αυτή την ημέρα");
      return;
    }
    if (!form.time) {
      toast.error("Παρακαλώ επίλεξε ώρα");
      return;
    }
    saveBookedSlot(form.date, form.time);
    setBooked(getBookedSlots());
    setSubmitted(true);
    toast.success("Το ραντεβού σου έκλεισε επιτυχώς!");
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
            Επίλεξε ημέρα και ώρα — βλέπεις μόνο τις διαθέσιμες ώρες του καταστήματος.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-8 md:p-10 shadow-elegant animate-scale-in">
          {submitted ? (
            <div className="text-center py-12 animate-fade-up">
              <div className="w-20 h-20 rounded-full bg-gradient-gold mx-auto flex items-center justify-center mb-6 animate-float">
                <Check className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="text-3xl font-serif mb-3">Το ραντεβού σου έκλεισε! 🎉</h3>
              <p className="text-muted-foreground mb-2">
                Σ' ευχαριστούμε <strong className="text-foreground">{form.name}</strong>!
              </p>
              <p className="text-muted-foreground mb-6">
                Σε περιμένουμε για <strong className="text-primary">{form.service}</strong> στις{" "}
                <strong className="text-primary">{form.date}</strong> στις{" "}
                <strong className="text-primary">{form.time}</strong>.<br />
                Θα σε καλέσουμε στο {form.phone} για επιβεβαίωση.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", phone: "", service: services[0], date: "", time: "" });
                }}
                className="text-primary hover:underline story-link"
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

              <Field icon={Scissors} label="Υπηρεσία" full>
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
                  min={today}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-smooth"
                />
              </Field>

              <Field icon={Clock} label="Ώρα">
                {!form.date ? (
                  <div className="w-full bg-input border border-border rounded-lg px-4 py-3 text-muted-foreground text-sm">
                    Επίλεξε πρώτα ημερομηνία
                  </div>
                ) : isClosedDay ? (
                  <div className="w-full bg-input border border-destructive/40 rounded-lg px-4 py-3 text-destructive text-sm">
                    Κλειστά αυτή την ημέρα
                  </div>
                ) : availableTimes.length === 0 ? (
                  <div className="w-full bg-input border border-border rounded-lg px-4 py-3 text-muted-foreground text-sm">
                    Δεν υπάρχουν διαθέσιμες ώρες
                  </div>
                ) : (
                  <select
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-smooth"
                  >
                    <option value="">Επίλεξε ώρα</option>
                    {availableTimes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <button
                type="submit"
                className="md:col-span-2 mt-2 px-7 py-4 rounded-full bg-gradient-gold text-primary-foreground font-medium hover-lift transition-smooth"
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
