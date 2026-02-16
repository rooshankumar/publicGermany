import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    const fromName = Deno.env.get("FROM_NAME") || "publicGermany";

    if (!brevoApiKey || !fromEmail) {
      return jsonResponse({ error: "Missing BREVO_API_KEY or FROM_EMAIL" }, { status: 500 });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.56.0");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch pending emails
    const { data: pendingEmails, error: fetchErr } = await supabase
      .from("emails_outbox")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchErr) {
      return jsonResponse({ error: "Failed to fetch outbox", details: fetchErr.message }, { status: 500 });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return jsonResponse({ success: true, processed: 0, message: "No pending emails" });
    }

    let sent = 0;
    let errors = 0;

    for (const email of pendingEmails) {
      try {
        const brevoPayload = {
          sender: { email: fromEmail, name: fromName },
          to: [{ email: email.to_email }],
          subject: email.subject,
          htmlContent: email.html,
        };

        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(brevoPayload),
        });

        if (brevoRes.ok) {
          await supabase.from("emails_outbox").update({
            status: "sent",
            sent_at: new Date().toISOString(),
          }).eq("id", email.id);

          // Log success
          await supabase.from("emails_log").insert({
            to_email: email.to_email,
            subject: email.subject,
            payload: brevoPayload,
            status: "success",
          });

          sent++;
        } else {
          const errBody = await brevoRes.text();
          await supabase.from("emails_outbox").update({
            status: "error",
          }).eq("id", email.id);

          await supabase.from("emails_log").insert({
            to_email: email.to_email,
            subject: email.subject,
            payload: brevoPayload,
            status: "error",
            error: errBody,
          });

          errors++;
        }
      } catch (emailErr) {
        await supabase.from("emails_outbox").update({ status: "error" }).eq("id", email.id);
        errors++;
      }
    }

    return jsonResponse({ success: true, processed: pendingEmails.length, sent, errors });
  } catch (err) {
    return jsonResponse({ error: "Internal error", details: String(err) }, { status: 500 });
  }
});
