// @ts-nocheck
// Supabase Edge Function: send-weekly-promo
// Purpose: Send weekly promotional emails to all active students
// Configure secrets via: supabase functions secrets set BREVO_API_KEY=... FROM_EMAIL=... FROM_NAME=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
// Schedule: In Vercel cron, set to run weekly (e.g., every Monday at 9 AM)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const APP_URL = "https://publicgermany.vercel.app";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// Unified email template function
function wrapInEmailTemplate(content: string, greeting = "Hello,", signOff = "Best regards,<br>Admin"): string {
  const formattedContent = content.replace(/\n/g, '<br>');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>publicGermany</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#000000; height:3px;"></td>
          <td style="background:#DD0000; height:3px;"></td>
          <td style="background:#FFCE00; height:3px;"></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:12px 16px; font-size:14px; line-height:1.6; color:#000000;">
      ${greeting}<br><br>
      ${formattedContent}
      <br><br>
      ${signOff}
    </td>
  </tr>
  <tr>
    <td style="padding:10px 16px; text-align:center; font-size:12px; color:#374151;">
      <em>
        Refer your friends and get <strong>₹1,000 instant cashback</strong> once they enroll.
      </em>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 16px; text-align:center; font-size:12px; color:#111827;">
      <a href="${APP_URL}" style="font-weight:bold; color:#111827; text-decoration:none;">
        publicGermany
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#000000; height:3px;"></td>
          <td style="background:#DD0000; height:3px;"></td>
          <td style="background:#FFCE00; height:3px;"></td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKey = Deno.env.get("BREVO_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    const fromName = Deno.env.get("FROM_NAME") || "publicGermany";

    if (!supabaseUrl || !serviceRole) return json({ error: "Missing SUPABASE_URL or SERVICE_ROLE" }, 500);
    if (!apiKey || !fromEmail) return json({ error: "Missing BREVO_API_KEY or FROM_EMAIL" }, 500);

    const supabase = createClient(supabaseUrl, serviceRole);

    // Helper to resolve student email via RPC
    const resolveEmail = async (userId: string): Promise<string | null> => {
      try {
        const { data, error } = await (supabase as any).rpc('get_user_email', { p_user_id: userId });
        if (error) return null;
        return (data as string) || null;
      } catch {
        return null;
      }
    };

    // Fetch all active students (those with profiles)
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('user_id, full_name, role')
      .eq('role', 'student'); // Only send to students, not admins

    if (profilesErr) throw profilesErr;

    if (!profiles || profiles.length === 0) {
      return json({ ok: true, message: "No students found", sent: 0 });
    }

    console.log(`📧 Found ${profiles.length} students to send promotional email`);

    let sent = 0;
    let failed = 0;

    for (const profile of profiles) {
      const to = await resolveEmail(profile.user_id);
      if (!to) {
        console.log(`⚠️ No email found for user ${profile.user_id}`);
        failed++;
        continue;
      }

      // Compose promotional email using unified template
      const subject = "Your Weekly Update from publicGermany 🇩🇪";
      const body = buildPromotionalEmail(profile.full_name || 'Student');

      // Send via Brevo HTTP API
      const brevoRes = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { email: fromEmail, name: fromName },
          to: [{ email: to }],
          subject,
          htmlContent: body,
        }),
      });

      const brevoJson = await brevoRes.json().catch(() => ({}));

      // Log email attempt
      try {
        await supabase.from('emails_log').insert({
          to_email: to,
          subject,
          template: 'weekly_promo',
          payload: { user_id: profile.user_id },
          status: brevoRes.ok ? 'success' : 'error',
          error: brevoRes.ok ? null : JSON.stringify(brevoJson),
        });
      } catch (_) {
        console.error('Failed to log email');
      }

      if (brevoRes.ok) {
        sent++;
        console.log(`✅ Sent promotional email to ${to}`);
      } else {
        failed++;
        console.error(`❌ Failed to send to ${to}:`, brevoJson);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return json({ 
      ok: true, 
      message: `Promotional emails sent`,
      total: profiles.length,
      sent, 
      failed 
    });
  } catch (e) {
    console.error('Error in send-weekly-promo:', e);
    return json({ error: String(e) }, 500);
  }
});

function buildPromotionalEmail(studentName: string): string {
  const content = [
    `Here's what's new this week 👇<br/><br/>`,
    
    `<strong>🎯 Limited-Time Offers</strong><br/>`,
    `Save up to ₹10,000 on Admission and Visa Packages.<br/>`,
    `<a href="${APP_URL}/services" style="color:#0066cc;">View Offers →</a><br/><br/>`,
    
    `<strong>📋 Application Tracking</strong><br/>`,
    `Stay organized and never miss a deadline — get automatic reminders.<br/>`,
    `<a href="${APP_URL}/dashboard" style="color:#0066cc;">Go to Dashboard →</a><br/><br/>`,
    
    `<strong>📄 Document Support</strong><br/>`,
    `Professional help with APS, SOP/LOR, and Visa files — all in one place.<br/>`,
    `<a href="${APP_URL}/services" style="color:#0066cc;">View Services →</a><br/><br/>`,
    
    `💡 <em>Tip: Start your applications at least 6 months early for a smooth process.</em><br/><br/>`,
    
    `<strong>⭐ Student Spotlight</strong><br/>`,
    `<em>"Got my university shortlist in 3 days — professional and reliable!"</em><br/>`,
    `— Parth Takkar, Sep 2025 Intake`
  ].join('');

  const greeting = `Hi ${studentName},`;
  return wrapInEmailTemplate(content, greeting, 'Best regards,<br>publicGermany Team');
}
