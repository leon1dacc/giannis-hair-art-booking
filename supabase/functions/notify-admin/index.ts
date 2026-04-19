// Edge function: notify-admin
// Sends an email to ADMIN_NOTIFY_EMAIL via Resend when a new booking is created.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BookingPayload {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFY_EMAIL");

    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      console.warn("Missing RESEND_API_KEY or ADMIN_NOTIFY_EMAIL");
      return new Response(JSON.stringify({ ok: false, reason: "not_configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as BookingPayload;

    // Basic validation
    if (!body.name || !body.phone || !body.service || !body.date || !body.time) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const escape = (s: string) =>
      s.replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
      );

    const html = `
      <div style="font-family:Arial,sans-serif;background:#f6f6f6;padding:20px">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e5e5">
          <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#111">✂️ Νέο ραντεβού</h2>
          <p style="color:#666;margin:0 0 20px">Γιάννης Hair Art</p>
          <table style="width:100%;border-collapse:collapse;font-size:15px;color:#222">
            <tr><td style="padding:8px 0;color:#888">Όνομα:</td><td style="padding:8px 0"><strong>${escape(body.name)}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#888">Τηλέφωνο:</td><td style="padding:8px 0"><a href="tel:${escape(body.phone)}" style="color:#111;text-decoration:none">${escape(body.phone)}</a></td></tr>
            <tr><td style="padding:8px 0;color:#888">Υπηρεσία:</td><td style="padding:8px 0">${escape(body.service)}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Ημερομηνία:</td><td style="padding:8px 0"><strong>${escape(body.date)}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#888">Ώρα:</td><td style="padding:8px 0"><strong>${escape(body.time)}</strong></td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="font-size:12px;color:#999;margin:0">Αυτόματο μήνυμα από το online booking</p>
        </div>
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Γιάννης Hair Art <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `Νέο ραντεβού — ${body.date} ${body.time} (${body.service})`,
        html,
        reply_to: undefined,
      }),
    });

    const result = await resp.json();
    if (!resp.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ ok: false, error: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-admin error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
