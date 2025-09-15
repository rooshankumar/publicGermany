// Supabase Edge Function: send-email
// Uses Brevo Transactional API (HTTP) to send emails.
// Configure secrets via: supabase functions secrets set BREVO_API_KEY=... FROM_EMAIL=... FROM_NAME=...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const { to, subject, html, text, templateId, params, cc, bcc } = await req.json();

    if (!to || !subject || (!html && !text && !templateId)) {
      return jsonResponse({ error: "Missing required fields: to, subject, and one of html/text/templateId" }, { status: 400 });
    }

    const apiKey = Deno.env.get("BREVO_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    const fromName = Deno.env.get("FROM_NAME") || "publicGermany";

    if (!apiKey || !fromEmail) {
      return jsonResponse({ error: "Missing BREVO_API_KEY or FROM_EMAIL in function secrets" }, { status: 500 });
    }

    const payload: Record<string, unknown> = {
      sender: { email: fromEmail, name: fromName },
      to: Array.isArray(to) ? to.map((e: string) => ({ email: e })) : [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      params: params || undefined,
    };

    if (templateId) {
      payload["templateId"] = Number(templateId);
      // For template-based emails, Brevo uses params for variables.
    }

    const brevoRes = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const brevoJson = await brevoRes.json().catch(() => ({}));

    // Optional logging to Supabase if service role is present
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceKey) {
        const supabase = createClient(supabaseUrl, serviceKey);
        await supabase.from("emails_log").insert({
          to_email: Array.isArray(to) ? to.join(",") : String(to),
          subject,
          template: templateId ? String(templateId) : null,
          payload: payload,
          status: brevoRes.ok ? "success" : "error",
          error: brevoRes.ok ? null : JSON.stringify(brevoJson),
        });
      }
    } catch (_) {
      // swallow logging errors
    }

    if (!brevoRes.ok) {
      return jsonResponse({ error: "Brevo send failed", details: brevoJson }, { status: 502 });
    }

    return jsonResponse({ success: true, brevo: brevoJson });
  } catch (err) {
    return jsonResponse({ error: "Bad Request", details: String(err) }, { status: 400 });
  }
});
