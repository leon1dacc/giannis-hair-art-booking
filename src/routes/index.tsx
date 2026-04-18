import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { About } from "@/components/About";
import { Booking } from "@/components/Booking";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <About />
        <Booking />
        <Contact />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
