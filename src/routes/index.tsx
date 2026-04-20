import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { About } from "@/components/About";
import { Booking } from "@/components/Booking";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Testimonials } from "@/components/Testimonials";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Γιάννης Hair Art — Κομμωτήριο στο Ίλιον" },
      {
        name: "description",
        content:
          "Γιάννης Hair Art: Κομμωτική, βαφή μαλλιών & ανταύγειες στο Ίλιον. Κλείσε ραντεβού online. Πετρουπόλεως 62, τηλ. 21 0262 7102.",
      },
      { property: "og:title", content: "Γιάννης Hair Art — Κομμωτήριο στο Ίλιον" },
      {
        property: "og:description",
        content: "Κομμωτική & βαφή μαλλιών με μεράκι. Κλείσε ραντεβού online.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [siteClosed, setSiteClosed] = useState<null | boolean>(null);
  const [closureMessage, setClosureMessage] = useState("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("site_closed, closure_message")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        setSiteClosed(!!data?.site_closed);
        setClosureMessage(data?.closure_message || "");
      });
  }, []);

  if (siteClosed) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-6 text-foreground">
        <Toaster />
        <div className="max-w-lg w-full bg-card border border-border rounded-3xl p-10 text-center shadow-elegant animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-card border border-border mx-auto flex items-center justify-center mb-6">
            <Lock className="h-9 w-9 text-primary" />
          </div>
          <h1 className="font-serif text-3xl mb-3">Προσωρινά Κλειστά</h1>
          <p className="text-muted-foreground whitespace-pre-line">
            {closureMessage || "Το κατάστημα είναι προσωρινά κλειστό. Σύντομα θα είμαστε ξανά κοντά σας."}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-8">
            Γιάννης Hair Art · 📞 21 0262 7102
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <About />
        <Testimonials />
        <Booking />
        <Contact />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
