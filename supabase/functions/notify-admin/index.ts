// Edge function: notify-admin
// Sends an email to ADMIN_NOTIFY_EMAIL via Resend when a new booking is created.
// Also sends a confirmation email to the customer if `customerEmail` is provided.
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
  customerEmail?: string;
  cancelToken?: string;
  siteUrl?: string;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );

async function sendEmail(opts: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
}) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      from: "Γιάννης Hair Art <onboarding@resend.dev>",
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
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

    if (!body.name || !body.phone || !body.service || !body.date || !body.time) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminHtml = `
      <div style="font-family:Arial,sans-serif;background:#f6f6f6;padding:20px">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e5e5">
          <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#111">✂️ Νέο ραντεβού</h2>
          <p style="color:#666;margin:0 0 20px">Γιάννης Hair Art</p>
          <table style="width:100%;border-collapse:collapse;font-size:15px;color:#222">
            <tr><td style="padding:8px 0;color:#888">Όνομα:</td><td style="padding:8px 0"><strong>${escape(body.name)}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#888">Τηλέφωνο:</td><td style="padding:8px 0"><a href="tel:${escape(body.phone)}" style="color:#111;text-decoration:none">${escape(body.phone)}</a></td></tr>
            ${body.customerEmail ? `<tr><td style="padding:8px 0;color:#888">Email:</td><td style="padding:8px 0">${escape(body.customerEmail)}</td></tr>` : ""}
            <tr><td style="padding:8px 0;color:#888">Υπηρεσία:</td><td style="padding:8px 0">${escape(body.service)}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Ημερομηνία:</td><td style="padding:8px 0"><strong>${escape(body.date)}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#888">Ώρα:</td><td style="padding:8px 0"><strong>${escape(body.time)}</strong></td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="font-size:12px;color:#999;margin:0">Αυτόματο μήνυμα από το online booking</p>
        </div>
      </div>
    `;

    const adminResp = await sendEmail({
      apiKey: RESEND_API_KEY,
      to: ADMIN_EMAIL,
      subject: `Νέο ραντεβού — ${body.date} ${body.time} (${body.service})`,
      html: adminHtml,
    });
    const adminResult = await adminResp.json();
    if (!adminResp.ok) console.error("Admin email error:", adminResult);

    let customerResult: any = null;
    if (body.customerEmail) {
      const cancelUrl = body.cancelToken && body.siteUrl
        ? `${body.siteUrl.replace(/\/$/, "")}/cancel?token=${body.cancelToken}`
        : null;
      const customerHtml = `
        <div style="font-family:Arial,sans-serif;background:#f6f6f6;padding:20px">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e5e5">
            <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#111">✂️ Επιβεβαίωση ραντεβού</h2>
            <p style="color:#666;margin:0 0 20px">Γιάννης Hair Art</p>
            <p style="color:#222;font-size:15px;margin:0 0 16px">
              Γεια σου <strong>${escape(body.name)}</strong>,<br/>
              Το ραντεβού σου κλείστηκε επιτυχώς! 🎉
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:15px;color:#222;background:#fafafa;border-radius:8px">
              <tr><td style="padding:10px 14px;color:#888">Υπηρεσία:</td><td style="padding:10px 14px"><strong>${escape(body.service)}</strong></td></tr>
              <tr><td style="padding:10px 14px;color:#888">Ημερομηνία:</td><td style="padding:10px 14px"><strong>${escape(body.date)}</strong></td></tr>
              <tr><td style="padding:10px 14px;color:#888">Ώρα:</td><td style="padding:10px 14px"><strong>${escape(body.time)}</strong></td></tr>
            </table>
            <p style="color:#222;font-size:14px;margin:20px 0 8px">📍 Πετρουπόλεως 62, Ίλιον</p>
            <p style="color:#222;font-size:14px;margin:0 0 8px">📞 21 0262 7102</p>
            ${cancelUrl ? `<div style="margin:24px 0;text-align:center"><a href="${cancelUrl}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">Ακύρωση ραντεβού</a></div>` : ""}
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="font-size:12px;color:#999;margin:0">Αν δεν μπορέσεις να έρθεις, μπορείς να ακυρώσεις από το παραπάνω κουμπί ή να μας πάρεις τηλέφωνο.</p>
          </div>
        </div>
      `;
      const custResp = await sendEmail({
        apiKey: RESEND_API_KEY,
        to: body.customerEmail,
        subject: `Επιβεβαίωση ραντεβού — ${body.date} ${body.time}`,
        html: customerHtml,
      });
      customerResult = await custResp.json();
      if (!custResp.ok) console.error("Customer email error:", customerResult);
    }

    return new Response(
      JSON.stringify({ ok: true, admin: adminResult, customer: customerResult }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("notify-admin error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
