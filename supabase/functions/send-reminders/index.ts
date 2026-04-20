// Edge function: send-reminders
// Called by pg_cron every 30 minutes. Sends 24h and 2h reminders to customers.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Γιάννης Hair Art <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
}

function reminderHtml(opts: {
  name: string;
  service: string;
  date: string;
  time: string;
  hoursLabel: string;
  cancelUrl: string | null;
}) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f6f6f6;padding:20px">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e5e5">
        <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#111">⏰ Υπενθύμιση ραντεβού</h2>
        <p style="color:#666;margin:0 0 20px">Γιάννης Hair Art</p>
        <p style="color:#222;font-size:15px;margin:0 0 16px">
          Γεια σου <strong>${escape(opts.name)}</strong>,<br/>
          Σου θυμίζουμε ότι έχεις ραντεβού σε <strong>${opts.hoursLabel}</strong>!
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;color:#222;background:#fafafa;border-radius:8px">
          <tr><td style="padding:10px 14px;color:#888">Υπηρεσία:</td><td style="padding:10px 14px"><strong>${escape(opts.service)}</strong></td></tr>
          <tr><td style="padding:10px 14px;color:#888">Ημερομηνία:</td><td style="padding:10px 14px"><strong>${escape(opts.date)}</strong></td></tr>
          <tr><td style="padding:10px 14px;color:#888">Ώρα:</td><td style="padding:10px 14px"><strong>${escape(opts.time)}</strong></td></tr>
        </table>
        <p style="color:#222;font-size:14px;margin:20px 0 8px">📍 Πετρουπόλεως 62, Ίλιον</p>
        <p style="color:#222;font-size:14px;margin:0 0 8px">📞 21 0262 7102</p>
        ${opts.cancelUrl ? `<div style="margin:24px 0;text-align:center"><a href="${opts.cancelUrl}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">Ακύρωση ραντεβού</a></div>` : ""}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:12px;color:#999;margin:0">Σε περιμένουμε!</p>
      </div>
    </div>
  `;
}

serve(async (_req) => {
  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SITE_URL = Deno.env.get("SITE_URL") || "";

    if (!RESEND_API_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(
        JSON.stringify({ ok: false, reason: "missing_env" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const results: Record<string, number> = { "24h": 0, "2h": 0, errors: 0 };

    for (const kind of ["24h", "2h"] as const) {
      const hoursLabel = kind === "24h" ? "24 ώρες" : "2 ώρες";
      const { data: due, error } = await supabase.rpc("get_due_reminders", { _kind: kind });
      if (error) {
        console.error(`get_due_reminders ${kind} error:`, error);
        continue;
      }
      for (const a of (due || []) as Array<{
        out_id: string;
        out_name: string;
        out_email: string;
        out_service: string;
        out_date: string;
        out_time: string;
        out_token: string;
      }>) {
        try {
          const cancelUrl = SITE_URL ? `${SITE_URL.replace(/\/$/, "")}/cancel?token=${a.out_token}` : null;
          const resp = await sendEmail(
            RESEND_API_KEY,
            a.out_email,
            `Υπενθύμιση ραντεβού — σε ${hoursLabel}`,
            reminderHtml({
              name: a.out_name,
              service: a.out_service,
              date: a.out_date,
              time: a.out_time,
              hoursLabel,
              cancelUrl,
            }),
          );
          if (resp.ok) {
            await supabase.rpc("mark_reminder_sent", { _id: a.out_id, _kind: kind });
            results[kind]++;
          } else {
            results.errors++;
            console.error("send error", await resp.text());
          }
        } catch (e) {
          results.errors++;
          console.error("reminder error", e);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-reminders fatal:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});