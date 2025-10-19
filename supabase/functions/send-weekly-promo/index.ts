// @ts-nocheck
// Supabase Edge Function: send-weekly-promo
// Purpose: Send weekly promotional emails to all active students
// Configure secrets via: supabase functions secrets set BREVO_API_KEY=... FROM_EMAIL=... FROM_NAME=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
// Schedule: In Vercel cron, set to run weekly (e.g., every Monday at 9 AM)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
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

      // Compose promotional email
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
  const lines = [];
  
  lines.push(`<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1C1C1C;max-width:600px;margin:0 auto;">`);
  lines.push(`<div style="background:#D00000;color:white;padding:20px;text-align:center;">`);
  lines.push(`<h1 style="margin:0;font-size:28px;">publicGermany</h1>`);
  lines.push(`<p style="margin:5px 0 0 0;font-size:14px;">Your Gateway to German Universities</p>`);
  lines.push(`</div>`);
  
  lines.push(`<div style="padding:30px 20px;">`);
  lines.push(`<p style="font-size:16px;">Hi ${studentName},</p>`);
  lines.push(`<p style="font-size:16px;line-height:1.6;margin-bottom:20px;">Here's what's new this week 👇</p>`);
  
  // Limited-Time Offers
  lines.push(`<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:4px;">`);
  lines.push(`<h3 style="margin:0 0 10px 0;color:#92400e;">🎯 Limited-Time Offers</h3>`);
  lines.push(`<p style="margin:0 0 10px 0;line-height:1.6;color:#78350f;">Save up to ₹10,000 on Admission and Visa Packages.</p>`);
  lines.push(`<a href="https://publicgermany.vercel.app/services" style="display:inline-block;padding:8px 16px;background:#f59e0b;color:white;text-decoration:none;border-radius:4px;font-weight:600;font-size:14px;">View Offers →</a>`);
  lines.push(`</div>`);
  
  // Application Tracking
  lines.push(`<div style="background:#f8f9fa;border-left:4px solid #D00000;padding:15px;margin:20px 0;border-radius:4px;">`);
  lines.push(`<h3 style="margin:0 0 10px 0;color:#D00000;">📋 Application Tracking</h3>`);
  lines.push(`<p style="margin:0 0 10px 0;line-height:1.6;">Stay organized and never miss a deadline — get automatic reminders.</p>`);
  lines.push(`<a href="https://publicgermany.vercel.app/dashboard" style="display:inline-block;padding:8px 16px;background:#D00000;color:white;text-decoration:none;border-radius:4px;font-weight:600;font-size:14px;">Go to Dashboard →</a>`);
  lines.push(`</div>`);
  
  // Document Support
  lines.push(`<div style="background:#f8f9fa;border-left:4px solid #2563eb;padding:15px;margin:20px 0;border-radius:4px;">`);
  lines.push(`<h3 style="margin:0 0 10px 0;color:#2563eb;">📄 Document Support</h3>`);
  lines.push(`<p style="margin:0 0 10px 0;line-height:1.6;">Professional help with APS, SOP/LOR, and Visa files — all in one place.</p>`);
  lines.push(`<a href="https://publicgermany.vercel.app/services" style="display:inline-block;padding:8px 16px;background:#2563eb;color:white;text-decoration:none;border-radius:4px;font-weight:600;font-size:14px;">View Services →</a>`);
  lines.push(`</div>`);
  
  // Tip
  lines.push(`<div style="background:#fffbeb;border-left:4px solid #fbbf24;padding:15px;margin:20px 0;border-radius:4px;">`);
  lines.push(`<p style="margin:0;line-height:1.6;color:#78350f;"><strong>💡 Tip:</strong> Start your applications at least 6 months early for a smooth process.</p>`);
  lines.push(`</div>`);
  
  // Student Spotlight
  lines.push(`<div style="background:#f0fdf4;border-left:4px solid #10b981;padding:15px;margin:20px 0;border-radius:4px;">`);
  lines.push(`<h3 style="margin:0 0 10px 0;color:#166534;">⭐ Student Spotlight</h3>`);
  lines.push(`<p style="margin:0;line-height:1.6;color:#166534;font-style:italic;">"Got my university shortlist in 3 days — professional and reliable!"</p>`);
  lines.push(`<p style="margin:5px 0 0 0;font-size:13px;color:#166534;">— Parth Takkar, Sep 2025 Intake</p>`);
  lines.push(`</div>`);
  
  // Trust line and CTA
  lines.push(`<div style="text-align:center;margin:30px 0;padding:20px;background:#f9fafb;border-radius:8px;">`);
  lines.push(`<p style="font-size:14px;color:#6b7280;margin:0 0 15px 0;">publicGermany — trusted by 50+ students for their journey to Germany.</p>`);
  lines.push(`<a href="https://publicgermany.vercel.app/dashboard" style="display:inline-block;padding:12px 30px;background:#D00000;color:white;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;">Visit Dashboard →</a>`);
  lines.push(`</div>`);
  
  // Footer
  lines.push(`<div style="border-top:1px solid #e5e7eb;margin-top:30px;padding-top:20px;text-align:center;">`);
  lines.push(`<p style="font-size:14px;color:#6b7280;margin:5px 0;">Questions? Reply to this email or visit our <a href="https://publicgermany.vercel.app/contact" style="color:#D00000;">contact page</a>.</p>`);
  lines.push(`<p style="font-size:12px;color:#9ca3af;margin:15px 0 5px 0;">© 2025 publicGermany. All rights reserved.</p>`);
  lines.push(`<p style="font-size:11px;color:#9ca3af;margin:5px 0;">You're receiving this because you have an account with publicGermany.</p>`);
  lines.push(`</div>`);
  
  lines.push(`</div>`);
  lines.push(`</div>`);
  
  return lines.join('\n');
}
