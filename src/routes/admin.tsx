import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Lock, LogOut, Calendar, Phone, User as UserIcon, Scissors, Trash2,
  ArrowLeft, Loader2, KeyRound, Settings, Power, Save, Mail,
} from "lucide-react";
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
  customer_email: string | null;
  service: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
};

type SiteSettings = {
  site_closed: boolean;
  booking_closed: boolean;
  closure_message: string;
};

const PIN_KEY = "yannis-admin-pin";

type FilterKey = "upcoming" | "completed" | "cancelled" | "all";

function timeUntil(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const target = new Date(y, m - 1, d, h, mi).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff < 0) return "πέρασε";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `σε ${mins}'`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `σε ${hours}h ${mins % 60}'`;
  const days = Math.floor(hours / 24);
  return `σε ${days}d ${hours % 24}h`;
}

function isPast(dateStr: string, timeStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, h, mi).getTime() < Date.now();
}

function AdminPage() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<FilterKey>("upcoming");
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    site_closed: false, booking_closed: false, closure_message: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [, setTick] = useState(0);

  // Tick every 30s so countdown labels stay fresh
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

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
    if (error || !data) {
      setLoading(false);
      if (!silent) toast.error("Λάθος PIN");
      sessionStorage.removeItem(PIN_KEY);
      return;
    }
    sessionStorage.setItem(PIN_KEY, candidatePin);
    setAuthed(true);
    await Promise.all([loadAppointments(candidatePin), loadSettings()]);
    setLoading(false);
  };

  const loadAppointments = async (pinToUse: string) => {
    const { data, error } = await supabase.rpc("admin_list_appointments", { _pin: pinToUse });
    if (error) {
      toast.error("Σφάλμα φόρτωσης");
      return;
    }
    setAppointments((data as Appointment[]) || []);
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("site_closed, booking_closed, closure_message")
      .eq("id", 1)
      .maybeSingle();
    if (data) setSettings(data as SiteSettings);
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

  const deleteAppointment = async (id: string) => {
    if (!confirm("Διαγραφή οριστικά; Δεν μπορείς να το αναιρέσεις.")) return;
    const { error } = await supabase.rpc("admin_delete_appointment", { _pin: pin, _id: id });
    if (error) {
      toast.error("Σφάλμα διαγραφής");
      return;
    }
    toast.success("Διαγράφηκε.");
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
      console.error(error);
      return;
    }
    toast.success("Το PIN άλλαξε επιτυχώς");
    sessionStorage.setItem(PIN_KEY, newPin);
    setPin(newPin);
    setNewPin("");
    setShowChangePin(false);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase.rpc("admin_set_settings", {
      _pin: pin,
      _site_closed: settings.site_closed,
      _booking_closed: settings.booking_closed,
      _closure_message: settings.closure_message,
    });
    setSavingSettings(false);
    if (error) {
      toast.error("Σφάλμα αποθήκευσης");
      return;
    }
    toast.success("Οι ρυθμίσεις αποθηκεύτηκαν");
  };

  const logout = () => {
    sessionStorage.removeItem(PIN_KEY);
    setAuthed(false);
    setPin("");
    setAppointments([]);
  };

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const past = isPast(a.appointment_date, a.appointment_time);
      if (filter === "upcoming") return a.status === "confirmed" && !past;
      if (filter === "completed") return a.status === "confirmed" && past;
      if (filter === "cancelled") return a.status === "cancelled";
      return true;
    }).sort((a, b) => {
      // upcoming sorted ascending, others descending
      const ka = `${a.appointment_date}T${a.appointment_time}`;
      const kb = `${b.appointment_date}T${b.appointment_time}`;
      return filter === "upcoming" ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });
  }, [appointments, filter]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4">
        <Toaster />
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-elegant animate-scale-in">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-6 story-link">
            <ArrowLeft className="h-3 w-3" /> Πίσω στο site
          </Link>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-card border border-border mx-auto flex items-center justify-center mb-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-serif text-2xl">Admin Panel</h1>
            <p className="text-xs text-muted-foreground mt-1">Εισήγαγε το PIN σου</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); tryLogin(pin); }} className="space-y-4">
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
              className="w-full px-5 py-3 rounded-full bg-foreground text-background font-medium hover-lift disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Είσοδος
            </button>
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
            {(settings.site_closed || settings.booking_closed) && (
              <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
                {settings.site_closed ? "Site κλειστό" : "Booking κλειστό"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowSettings(!showSettings); setShowChangePin(false); }}
              className="p-2 rounded-lg hover:bg-card transition-smooth text-muted-foreground hover:text-primary"
              aria-label="Ρυθμίσεις site">
              <Settings className="h-4 w-4" />
            </button>
            <button onClick={() => { setShowChangePin(!showChangePin); setShowSettings(false); }}
              className="p-2 rounded-lg hover:bg-card transition-smooth text-muted-foreground hover:text-primary"
              aria-label="Αλλαγή PIN">
              <KeyRound className="h-4 w-4" />
            </button>
            <Link to="/" className="p-2 rounded-lg hover:bg-card transition-smooth text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <button onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-primary text-sm transition-smooth">
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
              <button onClick={changePin}
                className="px-4 py-2 rounded-lg bg-foreground text-background font-medium hover-lift">
                Αλλαγή
              </button>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="max-w-md mx-auto mb-8 bg-card border border-border rounded-xl p-5 animate-scale-in">
            <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
              <Power className="h-4 w-4 text-primary" /> Ρυθμίσεις Site
            </h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.site_closed}
                  onChange={(e) => setSettings({ ...settings, site_closed: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <div>
                  <div className="text-sm font-medium">Πλήρες κλείσιμο site</div>
                  <div className="text-xs text-muted-foreground">Όλο το site δείχνει μόνο μήνυμα διακοπής.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.booking_closed}
                  onChange={(e) => setSettings({ ...settings, booking_closed: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <div>
                  <div className="text-sm font-medium">Κλείσιμο μόνο κρατήσεων</div>
                  <div className="text-xs text-muted-foreground">Το site λειτουργεί κανονικά αλλά δεν μπορούν να κλείσουν ραντεβού.</div>
                </div>
              </label>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Custom μήνυμα (εμφανίζεται όπου είναι κλειστό)</label>
                <textarea
                  value={settings.closure_message}
                  onChange={(e) => setSettings({ ...settings, closure_message: e.target.value })}
                  rows={3}
                  placeholder="π.χ. Διακοπές μέχρι 30/4. Καλό Πάσχα!"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <button onClick={saveSettings} disabled={savingSettings}
                className="w-full px-4 py-2.5 rounded-lg bg-foreground text-background font-medium hover-lift disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Αποθήκευση
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {([
            ["upcoming", "Επερχόμενα"],
            ["completed", "Ολοκληρωμένα"],
            ["cancelled", "Ακυρωμένα"],
            ["all", "Όλα"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm transition-smooth ${
                filter === key
                  ? "bg-foreground text-background"
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
            {filtered.map((a) => {
              const past = isPast(a.appointment_date, a.appointment_time);
              return (
                <div
                  key={a.id}
                  className={`bg-card border border-border rounded-xl p-5 flex flex-wrap items-center gap-4 animate-fade-up transition-smooth ${
                    a.status === "cancelled" ? "opacity-60" : "hover-lift"
                  }`}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <UserIcon className="h-4 w-4 text-primary" />
                      <strong>{a.customer_name}</strong>
                      {a.status === "cancelled" && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
                          Ακυρωμένο
                        </span>
                      )}
                      {a.status === "confirmed" && past && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Ολοκληρώθηκε
                        </span>
                      )}
                      {a.status === "confirmed" && !past && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                          {timeUntil(a.appointment_date, a.appointment_time)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {a.customer_phone}
                      </span>
                      {a.customer_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {a.customer_email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Scissors className="h-3 w-3" /> {a.service}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{a.appointment_date}</div>
                    <div className="text-sm text-primary">{a.appointment_time}</div>
                  </div>
                  <div className="flex gap-2">
                    {a.status === "confirmed" && !past && (
                      <button
                        onClick={() => cancelAppointment(a.id)}
                        className="p-2 rounded-lg border border-border hover:border-destructive hover:text-destructive transition-smooth"
                        aria-label="Ακύρωση"
                        title="Ακύρωση"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {a.status === "cancelled" && (
                      <button
                        onClick={() => deleteAppointment(a.id)}
                        className="p-2 rounded-lg border border-border hover:border-destructive hover:text-destructive transition-smooth"
                        aria-label="Διαγραφή"
                        title="Διαγραφή οριστικά"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}