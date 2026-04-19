import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, LogOut, Calendar, Phone, User as UserIcon, Scissors, Trash2, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Γιάννης Hair Art" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Appointment = {
  id: string;
  customer_name: string;
  customer_phone: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
};

const PIN_KEY = "yannis-admin-pin";

function AdminPage() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<"upcoming" | "all" | "cancelled">("upcoming");
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(PIN_KEY);
    if (saved) {
      setPin(saved);
      tryLogin(saved, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tryLogin = async (candidatePin: string, silent = false) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("verify_admin_pin", { _pin: candidatePin });
    setLoading(false);
    if (error || !data) {
      if (!silent) toast.error("Λάθος PIN");
      sessionStorage.removeItem(PIN_KEY);
      return;
    }
    sessionStorage.setItem(PIN_KEY, candidatePin);
    setAuthed(true);
    loadAppointments(candidatePin);
  };

  const loadAppointments = async (pinToUse: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_appointments", { _pin: pinToUse });
    setLoading(false);
    if (error) {
      toast.error("Σφάλμα φόρτωσης");
      return;
    }
    setAppointments((data as Appointment[]) || []);
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm("Σίγουρα θες να ακυρώσεις αυτό το ραντεβού;")) return;
    const { error } = await supabase.rpc("admin_cancel_appointment", { _pin: pin, _id: id });
    if (error) {
      toast.error("Σφάλμα ακύρωσης");
      return;
    }
    toast.success("Ραντεβού ακυρώθηκε. Η ώρα είναι ξανά διαθέσιμη.");
    loadAppointments(pin);
  };

  const changePin = async () => {
    if (newPin.length < 4) {
      toast.error("Το PIN πρέπει να είναι τουλάχιστον 4 χαρακτήρες");
      return;
    }
    const { error } = await supabase.rpc("admin_change_pin", { _old_pin: pin, _new_pin: newPin });
    if (error) {
      toast.error("Σφάλμα αλλαγής PIN");
      return;
    }
    toast.success("Το PIN άλλαξε επιτυχώς");
    sessionStorage.setItem(PIN_KEY, newPin);
    setPin(newPin);
    setNewPin("");
    setShowChangePin(false);
  };

  const logout = () => {
    sessionStorage.removeItem(PIN_KEY);
    setAuthed(false);
    setPin("");
    setAppointments([]);
  };

  const today = new Date().toISOString().split("T")[0];
  const filtered = appointments.filter((a) => {
    if (filter === "upcoming") return a.status === "confirmed" && a.appointment_date >= today;
    if (filter === "cancelled") return a.status === "cancelled";
    return true;
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4">
        <Toaster />
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-elegant animate-scale-in">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-6 story-link"
          >
            <ArrowLeft className="h-3 w-3" /> Πίσω στο site
          </Link>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-gold mx-auto flex items-center justify-center mb-3">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-2xl">Admin Panel</h1>
            <p className="text-xs text-muted-foreground mt-1">Εισήγαγε το PIN σου</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              tryLogin(pin);
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={20}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-center text-2xl tracking-widest text-foreground focus:outline-none focus:border-primary transition-smooth"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full px-5 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover-lift disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Είσοδος
            </button>
            <p className="text-[10px] text-muted-foreground/60 text-center">
              Default PIN: 1234 (άλλαξέ το μετά την πρώτη είσοδο)
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b border-border bg-card/40 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <h1 className="font-serif text-lg">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChangePin(!showChangePin)}
              className="p-2 rounded-lg hover:bg-card transition-smooth text-muted-foreground hover:text-primary"
              aria-label="Αλλαγή PIN"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-card transition-smooth text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-primary text-sm transition-smooth"
            >
              <LogOut className="h-3.5 w-3.5" /> Έξοδος
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {showChangePin && (
          <div className="max-w-md mx-auto mb-8 bg-card border border-border rounded-xl p-5 animate-scale-in">
            <h3 className="font-serif text-lg mb-3">Αλλαγή PIN</h3>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Νέο PIN (min 4)"
                className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
              <button
                onClick={changePin}
                className="px-4 py-2 rounded-lg bg-gradient-gold text-primary-foreground font-medium hover-lift"
              >
                Αλλαγή
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {([
            ["upcoming", "Επερχόμενα"],
            ["all", "Όλα"],
            ["cancelled", "Ακυρωμένα"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm transition-smooth ${
                filter === key
                  ? "bg-gradient-gold text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-primary hover:border-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Δεν υπάρχουν ραντεβού σε αυτή την κατηγορία.</p>
          </div>
        ) : (
          <div className="grid gap-3 max-w-3xl mx-auto">
            {filtered.map((a) => (
              <div
                key={a.id}
                className={`bg-card border border-border rounded-xl p-5 flex flex-wrap items-center gap-4 animate-fade-up transition-smooth ${
                  a.status === "cancelled" ? "opacity-60" : "hover-lift"
                }`}
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="h-4 w-4 text-primary" />
                    <strong>{a.customer_name}</strong>
                    {a.status === "cancelled" && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
                        Ακυρωμένο
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {a.customer_phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Scissors className="h-3 w-3" /> {a.service}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{a.appointment_date}</div>
                  <div className="text-sm text-primary">{a.appointment_time}</div>
                </div>
                {a.status === "confirmed" && (
                  <button
                    onClick={() => cancelAppointment(a.id)}
                    className="p-2 rounded-lg border border-border hover:border-destructive hover:text-destructive transition-smooth"
                    aria-label="Ακύρωση"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
