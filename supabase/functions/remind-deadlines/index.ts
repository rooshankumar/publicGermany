// Supabase Edge Function: remind-deadlines
// Purpose: Send automated application deadline reminders to students at 7/3/1 days before.
// Configure secrets via: supabase functions secrets set BREVO_API_KEY=... FROM_EMAIL=... FROM_NAME=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
// Schedule: In Supabase Dashboard → Edge Functions → Schedules, set to run daily.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const dayOffsets = [7, 3, 1];

serve(async (_req: Request) => {
  try {
    console.log('🔔 [remind-deadlines] Starting deadline reminder check at:', new Date().toISOString());
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKey = Deno.env.get("BREVO_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    const fromName = Deno.env.get("FROM_NAME") || "publicGermany";

    if (!supabaseUrl || !serviceRole) return json({ error: "Missing SUPABASE_URL or SERVICE_ROLE" }, 500);
    if (!apiKey || !fromEmail) return json({ error: "Missing BREVO_API_KEY or FROM_EMAIL" }, 500);

    const supabase = createClient(supabaseUrl, serviceRole);

    // Compute target dates
    const today = new Date();
    const targets = dayOffsets.map((d) => {
      const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      t.setUTCDate(t.getUTCDate() + d);
      // Compare by date only (YYYY-MM-DD)
      const yyyy = t.getUTCFullYear();
      const mm = String(t.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(t.getUTCDate()).padStart(2, '0');
      return { days: d, isoDate: `${yyyy}-${mm}-${dd}` };
    });

    // Fetch applications with deadlines on target dates
    const deadlines = targets.map(t => t.isoDate);
    const { data: apps, error: appsErr } = await supabase
      .from('applications')
      .select(`id, user_id, university_name, program_name, end_date, status, profiles!applications_user_id_fkey(full_name)`)
      .in('end_date', deadlines);
    if (appsErr) throw appsErr;

    if (!apps || apps.length === 0) return json({ ok: true, processed: 0, sent: 0 });

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
      const deadlineISO = new Date(app.end_date).toISOString().slice(0, 10);
      const target = targets.find(t => t.isoDate === deadlineISO);
      if (!target) continue;

      const key = `${app.id}:${target.days}`;
      if (sentSet.has(key)) continue; // already sent this offset

      const to = await resolveEmail(app.user_id);
      if (!to) continue;

      // Compose email
      const subject = `Reminder: ${app.university_name} deadline in ${target.days} day${target.days === 1 ? '' : 's'}`;
      const body = [
        `<p>Hi ${app.profiles?.full_name || ''},</p>`,
        `<p>This is a friendly reminder that the deadline for <strong>${app.university_name}</strong>` +
          (app.program_name ? ` — <em>${app.program_name}</em>` : '') + ` is in <strong>${target.days} day${target.days === 1 ? '' : 's'}</strong>.</p>`,
        `<p>Deadline: ${new Date(app.end_date).toLocaleDateString()}</p>`,
        `<p>Current status: <strong>${String(app.status || 'draft').replace('_',' ')}</strong></p>`,
        `<p>Please make sure your documents and application are complete on time.</p>`,
        `<p>— publicGermany Team</p>`
      ].join('\n');

      // Send via Brevo HTTP API
      attempted++;
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

      // Log and record reminder
      const brevoJson = await brevoRes.json().catch(() => ({}));

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
    return json({ ok: true, processed: attempted, sent });
  } catch (e) {
    console.error('❌ [remind-deadlines] Error:', String(e));
    return json({ error: String(e) }, 500);
  }
});
