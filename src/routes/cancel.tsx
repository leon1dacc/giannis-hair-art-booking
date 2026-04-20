import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Check, X, ArrowLeft, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cancel")({
  head: () => ({
    meta: [
      { title: "Ακύρωση ραντεβού · Γιάννης Hair Art" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CancelPage,
});

function CancelPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "already">("idle");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<{ name?: string; date?: string; time?: string }>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  const doCancel = async () => {
    if (!token) return;
    setStatus("loading");
    const { data, error } = await supabase.rpc("cancel_by_token", { _token: token });
    if (error) {
      setStatus("error");
      setMessage("Σφάλμα. Δοκίμασε ξανά.");
      return;
    }
    const row = (data as Array<{ success: boolean; message: string; out_name: string; out_date: string; out_time: string }>)?.[0];
    if (!row) {
      setStatus("error");
      setMessage("Μη έγκυρος σύνδεσμος");
      return;
    }
    setDetails({ name: row.out_name, date: row.out_date, time: row.out_time });
    setMessage(row.message);
    if (row.success) setStatus("success");
    else if (row.message?.includes("ήδη")) setStatus("already");
    else setStatus("error");
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-elegant animate-scale-in">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-6 story-link">
          <ArrowLeft className="h-3 w-3" /> Επιστροφή
        </Link>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-card border border-border mx-auto flex items-center justify-center mb-3">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-serif text-2xl">Ακύρωση Ραντεβού</h1>
        </div>

        {!token ? (
          <p className="text-center text-sm text-destructive">Λείπει το token από τον σύνδεσμο.</p>
        ) : status === "idle" ? (
          <>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Είσαι σίγουρος ότι θες να ακυρώσεις το ραντεβού σου;
            </p>
            <button
              onClick={doCancel}
              className="w-full px-5 py-3 rounded-full bg-destructive text-destructive-foreground font-medium hover-lift transition-smooth"
            >
              Ναι, ακύρωσέ το
            </button>
          </>
        ) : status === "loading" ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : status === "success" ? (
          <div className="text-center py-4 animate-fade-up">
            <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
              <Check className="h-7 w-7 text-primary" />
            </div>
            <p className="text-foreground mb-2">{message}</p>
            {details.date && (
              <p className="text-sm text-muted-foreground">{details.date} στις {details.time}</p>
            )}
          </div>
        ) : status === "already" ? (
          <p className="text-center text-sm text-muted-foreground">{message}</p>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 mx-auto flex items-center justify-center mb-4">
              <X className="h-7 w-7 text-destructive" />
            </div>
            <p className="text-sm text-destructive">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}