// Supabase Edge Function: remind-deadlines
// Purpose: Send automated application reminders for BOTH opening (start_date) and closing (end_date/application_end_date).
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
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function wrapInEmailTemplate(content: string, greeting = "Hello,", signOff = "Best regards,<br>Admin"): string {
  const formattedContent = content.replace(/\n/g, '<br>');
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>publicGermany</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#000000;height:3px;"></td><td style="background:#DD0000;height:3px;"></td><td style="background:#FFCE00;height:3px;"></td></tr></table></td></tr>
  <tr><td style="padding:12px 16px;font-size:14px;line-height:1.6;color:#000000;">${greeting}<br><br>${formattedContent}<br><br>${signOff}</td></tr>
  <tr><td style="padding:10px 16px;text-align:center;font-size:12px;color:#374151;"><em>Refer your friends and get <strong>₹1,000 instant cashback</strong> once they enroll.</em></td></tr>
  <tr><td style="padding:8px 16px;text-align:center;font-size:12px;color:#111827;"><a href="${APP_URL}" style="font-weight:bold;color:#111827;text-decoration:none;">publicGermany</a></td></tr>
  <tr><td style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#000000;height:3px;"></td><td style="background:#DD0000;height:3px;"></td><td style="background:#FFCE00;height:3px;"></td></tr></table></td></tr>
</table>
</body></html>`;
}

const dayOffsets = [14, 10, 7, 5, 2, 1];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 [remind-deadlines] Starting at:', new Date().toISOString());
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    const fromName = Deno.env.get("FROM_NAME") || "publicGermany";

    if (!supabaseUrl || !serviceRole) return json({ error: "Missing SUPABASE_URL or SERVICE_ROLE" }, 500);
    if (!brevoApiKey || !fromEmail) return json({ error: "Missing BREVO_API_KEY or FROM_EMAIL" }, 500);

    const supabase = createClient(supabaseUrl, serviceRole);

    const today = new Date();
    const targets = dayOffsets.map((d) => {
      const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      t.setUTCDate(t.getUTCDate() + d);
      const yyyy = t.getUTCFullYear();
      const mm = String(t.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(t.getUTCDate()).padStart(2, '0');
      return { days: d, isoDate: `${yyyy}-${mm}-${dd}` };
    });
    const targetDates = targets.map(t => t.isoDate);
    console.log(`🎯 Target dates:`, targetDates.join(', '));

    // Fetch already sent reminders
    const { data: sentRows } = await supabase
      .from('deadline_reminders' as any)
      .select('application_id, day_offset');
    const sentSet = new Set((sentRows || []).map((r: any) => `${r.application_id}:${r.day_offset}`));

    const resolveEmail = async (userId: string): Promise<string | null> => {
      try {
        const { data, error } = await (supabase as any).auth.admin.getUserById(userId);
        if (error) return null;
        return (data as any)?.user?.email || null;
      } catch { return null; }
    };

    let attempted = 0;
    let sent = 0;

    // ========== 1. APPLICATION OPENING REMINDERS (start_date) ==========
    const { data: openingApps, error: openErr } = await supabase
      .from('applications')
      .select(`id, user_id, university_name, program_name, start_date, end_date, application_start_date, application_end_date, status, notes, profiles!applications_user_id_fkey(full_name)`)
      .in('application_start_date', targetDates)
      .neq('status', 'submitted');
    if (openErr) console.error('Opening query error:', openErr);

    console.log(`📂 Opening reminders: ${openingApps?.length || 0} apps found`);

    for (const app of (openingApps || []) as any[]) {
      const dateISO = app.application_start_date;
      if (!dateISO) continue;
      const target = targets.find(t => t.isoDate === dateISO);
      if (!target) continue;
      const key = `${app.id}:open:${target.days}`;
      if (sentSet.has(key)) continue;

      const to = await resolveEmail(app.user_id);
      if (!to) continue;

      const studentName = app.profiles?.full_name || 'Student';
      const dateFormatted = new Date(dateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const deadlineFormatted = (app.application_end_date || app.end_date) ? new Date(app.application_end_date || app.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';

      const subject = target.days <= 1 ? '🚨 Application Opens Tomorrow!' :
                      target.days <= 2 ? '⚠️ Application Opens in 2 Days!' :
                      target.days <= 5 ? `⏰ Application Opens in ${target.days} Days` :
                      `📋 Application Opens in ${target.days} Days`;

      const content = [
        `The following university application is opening soon.<br/>`,
        `Please make sure you are actively preparing and ready to apply.<br/><br/>`,
        `<strong>Universities & Programs</strong><br/>`,
        `${app.university_name} — ${app.program_name}<br/>`,
        `📅 Opens: ${dateFormatted}<br/>`,
        `📅 Deadline: ${deadlineFormatted}<br/><br/>`,
        app.notes ? `<em>${app.notes}</em><br/><br/>` : '',
        `We strongly recommend preparing early to avoid document issues or portal delays.<br/><br/>`,
        `If you're unsure about eligibility, documents, or the application process, just reply to this email — we'll guide you step by step.<br/><br/>`,
        `You've got this 💪`
      ].join('');

      attempted++;
      const body = wrapInEmailTemplate(content, `Hello ${studentName},`, 'Best regards,<br>Roshan');
      const brevoRes = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: { 'api-key': brevoApiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { email: fromEmail, name: fromName }, to: [{ email: to }], subject, htmlContent: body }),
      });
      const brevoJson = await brevoRes.json().catch(() => ({}));
      console.log(`📧 Opening → ${to}: ${brevoRes.ok ? '✅' : '❌'}`);

      try { await supabase.from('emails_log').insert({ to_email: to, subject, template: 'application_opening_reminder', payload: { application_id: app.id, day_offset: target.days, type: 'opening' }, status: brevoRes.ok ? 'success' : 'error', error: brevoRes.ok ? null : JSON.stringify(brevoJson) }); } catch {}
      if (brevoRes.ok) {
        sent++;
        try { await supabase.from('deadline_reminders').insert({ application_id: app.id, day_offset: target.days, sent_at: new Date().toISOString() }); } catch {}
      }
    }

    // ========== 2. APPLICATION CLOSING/DEADLINE REMINDERS (application_end_date) ==========
    const { data: closingApps, error: closeErr } = await supabase
      .from('applications')
      .select(`id, user_id, university_name, program_name, start_date, end_date, application_start_date, application_end_date, status, notes, profiles!applications_user_id_fkey(full_name)`)
      .in('application_end_date', targetDates)
      .neq('status', 'submitted');
    if (closeErr) console.error('Closing query error:', closeErr);

    console.log(`📂 Closing reminders: ${closingApps?.length || 0} apps found`);

    for (const app of (closingApps || []) as any[]) {
      const dateISO = app.application_end_date;
      if (!dateISO) continue;
      const target = targets.find(t => t.isoDate === dateISO);
      if (!target) continue;
      const key = `${app.id}:close:${target.days}`;
      if (sentSet.has(key)) continue;

      const to = await resolveEmail(app.user_id);
      if (!to) continue;

      const studentName = app.profiles?.full_name || 'Student';
      const deadlineFormatted = new Date(dateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      const subject = target.days <= 1 ? '🚨 Application Deadline Tomorrow!' :
                      target.days <= 2 ? '⚠️ Application Deadline in 2 Days!' :
                      target.days <= 5 ? `⏰ Application Deadline in ${target.days} Days` :
                      `📅 Application Deadline in ${target.days} Days`;

      const content = [
        `The following university application deadline is approaching.<br/>`,
        `Please make sure you are actively following and completing them.<br/><br/>`,
        `<strong>Universities & Programs</strong><br/>`,
        `${app.university_name} — ${app.program_name}<br/>`,
        `📅 Deadline: ${deadlineFormatted}<br/><br/>`,
        app.notes ? `<em>${app.notes}</em><br/><br/>` : '',
        `We strongly recommend starting early to avoid document issues or portal delays.<br/><br/>`,
        `If you're unsure about eligibility, documents, or the application process, just reply to this email — we'll guide you step by step.<br/><br/>`,
        `You've got this 💪`
      ].join('');

      attempted++;
      const body = wrapInEmailTemplate(content, `Hello ${studentName},`, 'Best regards,<br>Roshan');
      const brevoRes = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: { 'api-key': brevoApiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { email: fromEmail, name: fromName }, to: [{ email: to }], subject, htmlContent: body }),
      });
      const brevoJson = await brevoRes.json().catch(() => ({}));
      console.log(`📧 Closing → ${to}: ${brevoRes.ok ? '✅' : '❌'}`);

      try { await supabase.from('emails_log').insert({ to_email: to, subject, template: 'application_deadline_reminder', payload: { application_id: app.id, day_offset: target.days, type: 'closing' }, status: brevoRes.ok ? 'success' : 'error', error: brevoRes.ok ? null : JSON.stringify(brevoJson) }); } catch {}
      if (brevoRes.ok) {
        sent++;
        try { await supabase.from('deadline_reminders').insert({ application_id: app.id, day_offset: target.days, sent_at: new Date().toISOString() }); } catch {}
      }
    }

    console.log(`✅ [remind-deadlines] Done: ${attempted} attempted, ${sent} sent`);
    return json({ ok: true, processed: attempted, sent }, 200);
  } catch (e) {
    console.error('❌ [remind-deadlines] Error:', String(e));
    return json({ error: String(e) }, 500);
  }
});
