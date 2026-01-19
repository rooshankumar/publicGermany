// Supabase Edge Function: remind-deadlines
// Purpose: Send automated application deadline reminders to students at 7/3/1 days before.
// Configure secrets via: supabase functions secrets set BREVO_API_KEY=... FROM_EMAIL=... FROM_NAME=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
// Schedule: In Supabase Dashboard → Edge Functions → Schedules, set to run daily.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const APP_URL = "https://publicgermany.vercel.app";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
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

const dayOffsets = [14, 10, 7, 5, 2, 1];

serve(async (req: Request) => {
  // Handle CORS preflight requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 [remind-deadlines] Starting deadline reminder check at:', new Date().toISOString());
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    const fromName = Deno.env.get("FROM_NAME") || "publicGermany";

    if (!supabaseUrl || !serviceRole) return json({ error: "Missing SUPABASE_URL or SERVICE_ROLE" }, 500);
    if (!brevoApiKey || !fromEmail) return json({ error: "Missing BREVO_API_KEY or FROM_EMAIL" }, 500);

    const supabase = createClient(supabaseUrl, serviceRole);

    // Compute target dates
    const today = new Date();
    console.log(`📅 Today (UTC): ${today.toISOString()}`);
    console.log(`📅 Today (date only): ${today.toISOString().split('T')[0]}`);
    
    const targets = dayOffsets.map((d) => {
      const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      t.setUTCDate(t.getUTCDate() + d);
      const yyyy = t.getUTCFullYear();
      const mm = String(t.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(t.getUTCDate()).padStart(2, '0');
      return { days: d, isoDate: `${yyyy}-${mm}-${dd}` };
    });
    
    console.log(`🎯 Target dates for reminders:`, targets.map(t => `${t.days} days: ${t.isoDate}`).join(' | '));

    // Fetch applications with deadlines on target dates
    const deadlines = targets.map(t => t.isoDate);
    const { data: apps, error: appsErr } = await supabase
      .from('applications')
      .select(`id, user_id, university_name, program_name, end_date, status, profiles!applications_user_id_fkey(full_name)`)
      .in('end_date', deadlines);
    if (appsErr) throw appsErr;

    console.log(`📊 Query results: Found ${apps?.length || 0} applications with matching deadlines`);
    if (apps && apps.length > 0) {
      console.log(`📋 Applications found:`, apps.map((a: any) => ({
        id: a.id,
        university: a.university_name,
        program: a.program_name,
        deadline: a.end_date,
        status: a.status,
        studentName: a.profiles?.full_name
      })));
    }

    if (!apps || apps.length === 0) {
      console.log(`✅ No applications found for target dates. Exiting.`);
      return json({ ok: true, processed: 0, sent: 0 });
    }

    // Fetch already sent reminders
    const { data: sentRows } = await supabase
      .from('deadline_reminders' as any)
      .select('application_id, day_offset');
    const sentSet = new Set((sentRows || []).map(r => `${r.application_id}:${r.day_offset}`));

    const resolveEmail = async (userId: string): Promise<string | null> => {
      try {
        const { data, error } = await (supabase as any).auth.admin.getUserById(userId);
        if (error) {
          console.error(`❌ Failed to get user ${userId}:`, error.message);
          return null;
        }
        const email = (data as any)?.user?.email || null;
        if (email) {
          console.log(`✅ Resolved email for ${userId}: ${email}`);
        } else {
          console.warn(`⚠️ No email found for user ${userId}`);
        }
        return email;
      } catch (err) {
        console.error(`❌ Exception resolving email for ${userId}:`, err);
        return null;
      }
    };

    let attempted = 0;
    let sent = 0;

    for (const app of apps as any[]) {
      console.log(`\n📌 Processing application: ${app.university_name}`);
      const deadlineISO = new Date(app.end_date).toISOString().slice(0, 10);
      const target = targets.find(t => t.isoDate === deadlineISO);
      if (!target) {
        console.log(`   ⏭️ Skipped: No matching target date`);
        continue;
      }

      const key = `${app.id}:${target.days}`;
      if (sentSet.has(key)) {
        console.log(`   ⏭️ Skipped: Reminder already sent for ${target.days}-day offset`);
        continue;
      }

      console.log(`   🔍 Resolving email for user ${app.user_id}...`);
      const to = await resolveEmail(app.user_id);
      if (!to) {
        console.log(`   ⏭️ Skipped: Could not resolve email address`);
        continue;
      }
      console.log(`   ✅ Email resolved: ${to}`);

      // Compose email content using the user's template
      const studentName = app.profiles?.full_name || 'Student';
      const deadlineFormatted = new Date(app.end_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      // Determine subject based on urgency
      let subject = '';
      if (target.days === 1) {
        subject = '🚨 URGENT: Application Deadline Tomorrow!';
      } else if (target.days === 2) {
        subject = '⚠️ Application Deadline in 2 Days!';
      } else if (target.days <= 5) {
        subject = `⏰ Application Deadline in ${target.days} Days`;
      } else if (target.days <= 7) {
        subject = `📅 Application Deadline in ${target.days} Days`;
      } else {
        subject = `📋 Application Deadline in ${target.days} Days`;
      }
      
      const content = [
        `The following university application deadlines are approaching.<br/>`,
        `Please make sure you are actively following and completing them.<br/><br/>`,
        `<strong>Universities & Programs</strong><br/>`,
        `${app.university_name} — ${app.program_name}<br/>`,
        `📅 Deadline: ${deadlineFormatted}<br/><br/>`,
        app.notes ? `<em>${app.notes}</em><br/><br/>` : '',
        `We strongly recommend starting early to avoid document issues or portal delays.<br/><br/>`,
        `If you're unsure about eligibility, documents, or the application process, just reply to this email — we'll guide you step by step.<br/><br/>`,
        `You've got this 💪`
      ].join('');
      
      const greeting = `Hello ${studentName},`;
      const body = wrapInEmailTemplate(content, greeting, 'Best regards,<br>Roshan');

      // Send via Brevo HTTP API
      attempted++;
      console.log(`📧 Sending email to ${to} for ${app.university_name}...`);
      const brevoRes = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: { 'api-key': brevoApiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { email: fromEmail, name: fromName },
          to: [{ email: to }],
          subject,
          htmlContent: body,
        }),
      });

      // Log and record reminder
      const brevoJson = await brevoRes.json().catch(() => ({}));
      console.log(`📬 Brevo response: ${brevoRes.status} ${brevoRes.statusText}`, brevoRes.ok ? '✅ Success' : '❌ Failed');
      if (!brevoRes.ok) {
        console.error(`   Error details:`, brevoJson);
      }

      try {
        await supabase.from('emails_log').insert({
          to_email: to,
          subject,
          template: 'deadline_reminder',
          payload: { application_id: app.id, day_offset: target.days },
          status: brevoRes.ok ? 'success' : 'error',
          error: brevoRes.ok ? null : JSON.stringify(brevoJson),
        });
      } catch (_) {}

      if (brevoRes.ok) {
        sent++;
        try {
          await supabase.from('deadline_reminders').insert({
            application_id: app.id,
            day_offset: target.days,
            sent_at: new Date().toISOString(),
          });
        } catch (_) {}
      }
    }

    console.log(`✅ [remind-deadlines] Completed: ${attempted} attempted, ${sent} sent`);
    return json({ ok: true, processed: attempted, sent }, 200);
  } catch (e) {
    console.error('❌ [remind-deadlines] Error:', String(e));
    return json({ error: String(e) }, 500);
  }
});
