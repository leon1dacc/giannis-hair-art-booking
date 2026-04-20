import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, User, Phone, Check, Scissors, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { generateSlots, isClosed } from "@/lib/schedule";

const services = ["Κούρεμα", "Βαφή Μαλλιών"];

const bookingSchema = z.object({
  name: z.string().trim().min(2, "Το όνομα είναι πολύ μικρό").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Το τηλέφωνο πρέπει να είναι 10 ψηφία"),
  email: z.string().trim().email("Μη έγκυρο email").max(255),
  service: z.enum(["Κούρεμα", "Βαφή Μαλλιών"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Επίλεξε ώρα"),
});

export function Booking() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingClosed, setBookingClosed] = useState(false);
  const [closureMessage, setClosureMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: services[0],
    date: "",
    time: "",
  });

  const today = new Date().toISOString().split("T")[0];

  // Load site settings to know if booking is closed
  useEffect(() => {
    supabase
      .from("site_settings")
      .select("booking_closed, site_closed, closure_message")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBookingClosed(!!data.booking_closed || !!data.site_closed);
          setClosureMessage(data.closure_message || "");
        }
      });
  }, []);

  const dayOfWeek = useMemo(() => {
    if (!form.date) return -1;
    const [y, m, d] = form.date.split("-").map(Number);
    return new Date(y, m - 1, d).getDay();
  }, [form.date]);

  const closed = form.date ? isClosed(dayOfWeek) : false;

  const availableTimes = useMemo(() => {
    if (!form.date || closed) return [];
    return generateSlots(dayOfWeek).filter((s) => !bookedTimes.includes(s));
  }, [form.date, dayOfWeek, closed, bookedTimes]);

  // Fetch booked slots whenever date changes
  useEffect(() => {
    if (!form.date || closed) {
      setBookedTimes([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    supabase
      .rpc("get_booked_slots", { _date: form.date })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error(error);
          setBookedTimes([]);
        } else {
          setBookedTimes((data || []).map((r: { appointment_time: string }) => r.appointment_time));
        }
        setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.date, closed]);

  // Realtime subscription so users see slot disappear instantly when someone else books
  useEffect(() => {
    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          if (form.date) {
            supabase.rpc("get_booked_slots", { _date: form.date }).then(({ data }) => {
              setBookedTimes((data || []).map((r: { appointment_time: string }) => r.appointment_time));
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [form.date]);

  const handleDateChange = (date: string) => {
    setForm((f) => ({ ...f, date, time: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = bookingSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    if (closed) {
      toast.error("Το κατάστημα είναι κλειστό αυτή την ημέρα");
      return;
    }

    setSubmitting(true);

    // Get visitor IP (best-effort, used to limit bookings per IP per day)
    let ip = "";
    try {
      const ipResp = await fetch("https://api.ipify.org?format=json");
      const ipJson = await ipResp.json();
      ip = ipJson.ip || "";
    } catch {
      // ignore
    }

    const { data: bookData, error } = await supabase.rpc("book_appointment", {
      _name: form.name.trim(),
      _phone: form.phone.trim(),
      _email: form.email.trim(),
      _service: form.service,
      _date: form.date,
      _time: form.time,
      _ip: ip || "",
    });
    setSubmitting(false);

    if (error) {
      const msg = error.message || "";
      if (msg.includes("slot_taken") || msg.includes("Αυτή η ώρα")) {
        toast.error("Αυτή η ώρα μόλις κλείστηκε. Παρακαλώ διάλεξε άλλη.");
        const { data } = await supabase.rpc("get_booked_slots", { _date: form.date });
        setBookedTimes((data || []).map((r: { appointment_time: string }) => r.appointment_time));
        setForm((f) => ({ ...f, time: "" }));
      } else if (msg.includes("limit_reached") || msg.includes("2 ραντεβού")) {
        toast.error("Έχεις ήδη κλείσει 2 ραντεβού για αυτή την ημέρα.");
      } else if (msg.includes("booking_closed") || msg.includes("προσωρινά κλειστές")) {
        toast.error("Οι κρατήσεις είναι προσωρινά κλειστές. Δοκίμασε αργότερα.");
        setBookingClosed(true);
      } else {
        toast.error("Σφάλμα κατά την κράτηση. Δοκίμασε ξανά.");
        console.error(error);
      }
      return;
    }

    const cancelToken = (bookData as Array<{ out_id: string; out_token: string }>)?.[0]?.out_token;

    // Fire-and-forget: notify admin + send confirmation email to customer
    supabase.functions
      .invoke("notify-admin", {
        body: {
          name: form.name,
          phone: form.phone,
          service: form.service,
          date: form.date,
          time: form.time,
          customerEmail: form.email.trim(),
          cancelToken,
          siteUrl: window.location.origin,
        },
      })
      .catch((e) => console.warn("notify-admin failed", e));

    setSubmitted(true);
    toast.success("Το ραντεβού σου κλείστηκε! Θα λάβεις email επιβεβαίωσης. 🎉");
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
            Επίλεξε ημέρα και ώρα — βλέπεις σε πραγματικό χρόνο μόνο τις διαθέσιμες ώρες.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-8 md:p-10 shadow-elegant animate-scale-in">
          {bookingClosed ? (
            <div className="text-center py-12 animate-fade-up">
              <div className="w-20 h-20 rounded-full bg-card border border-border mx-auto flex items-center justify-center mb-6">
                <Lock className="h-9 w-9 text-primary" />
              </div>
              <h3 className="text-2xl font-serif mb-3">Οι κρατήσεις είναι προσωρινά κλειστές</h3>
              <p className="text-muted-foreground max-w-md mx-auto whitespace-pre-line">
                {closureMessage || "Παρακαλώ δοκίμασε ξανά αργότερα. Για άμεση επικοινωνία, καλέστε στο 21 0262 7102."}
              </p>
            </div>
          ) : submitted ? (
            <div className="text-center py-12 animate-fade-up">
              <div className="w-20 h-20 rounded-full bg-gradient-gold mx-auto flex items-center justify-center mb-6 animate-float">
                <Check className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="text-3xl font-serif mb-3">Το ραντεβού σου κλείστηκε! 🎉</h3>
              <p className="text-muted-foreground mb-2">
                Σ' ευχαριστούμε <strong className="text-foreground">{form.name}</strong>!
              </p>
              <p className="text-muted-foreground mb-6">
                Σε περιμένουμε για <strong className="text-primary">{form.service}</strong> στις{" "}
                <strong className="text-primary">{form.date}</strong> στις{" "}
                <strong className="text-primary">{form.time}</strong>.<br />
                Σου στείλαμε email επιβεβαίωσης στο {form.email}.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", phone: "", email: "", service: services[0], date: "", time: "" });
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
                  maxLength={100}
                />
              </Field>

              <Field icon={Phone} label="Τηλέφωνο (10 ψηφία)">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-smooth"
                  placeholder="69XXXXXXXX"
                  maxLength={10}
                  inputMode="numeric"
                />
              </Field>

              <Field icon={Mail} label="Email" full>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-smooth"
                  placeholder="you@example.com"
                  maxLength={255}
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
                ) : closed ? (
                  <div className="w-full bg-input border border-destructive/40 rounded-lg px-4 py-3 text-destructive text-sm">
                    Κλειστά αυτή την ημέρα
                  </div>
                ) : loadingSlots ? (
                  <div className="w-full bg-input border border-border rounded-lg px-4 py-3 text-muted-foreground text-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Φόρτωση διαθέσιμων ωρών…
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
                disabled={submitting}
                className="md:col-span-2 mt-2 px-7 py-4 rounded-full bg-gradient-gold text-primary-foreground font-medium hover-lift transition-smooth disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Επιβεβαίωση…" : "Επιβεβαίωση Ραντεβού"}
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
