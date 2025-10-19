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
      const subject = "🎓 Your Weekly Update from publicGermany";
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
  lines.push(`<h1 style="margin:0;font-size:28px;">🎓 publicGermany</h1>`);
  lines.push(`<p style="margin:5px 0 0 0;font-size:14px;">Your Gateway to German Universities</p>`);
  lines.push(`</div>`);
  
  lines.push(`<div style="padding:30px 20px;">`);
  lines.push(`<p style="font-size:16px;">Hi ${studentName},</p>`);
  lines.push(`<p style="font-size:16px;line-height:1.6;">Hope you're having a great week! Here's what's new at publicGermany:</p>`);
  
  // Limited-Time Offers Banner
  lines.push(`<div style="background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);border-radius:8px;padding:20px;margin:20px 0;text-align:center;border:2px solid #d97706;">`);
  lines.push(`<h2 style="margin:0 0 10px 0;color:#78350f;font-size:22px;">🎉 Limited-Time Offers!</h2>`);
  lines.push(`<p style="margin:0 0 15px 0;color:#78350f;font-size:14px;font-weight:600;">Save up to ₹10,000 on our most popular packages</p>`);
  lines.push(`<div style="display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin-top:15px;">`);
  lines.push(`<div style="background:white;padding:15px;border-radius:6px;flex:1;min-width:200px;">`);
  lines.push(`<div style="font-size:12px;color:#78350f;font-weight:600;">ADMISSION PACKAGE</div>`);
  lines.push(`<div style="font-size:20px;font-weight:bold;color:#D00000;margin:5px 0;">₹20,000 - ₹25,000</div>`);
  lines.push(`<div style="font-size:11px;color:#6b7280;text-decoration:line-through;">Was ₹30,000</div>`);
  lines.push(`<div style="font-size:12px;color:#6b7280;margin-top:5px;">Profile eval, SOP/LOR, shortlisting</div>`);
  lines.push(`</div>`);
  lines.push(`<div style="background:white;padding:15px;border-radius:6px;flex:1;min-width:200px;">`);
  lines.push(`<div style="font-size:12px;color:#78350f;font-weight:600;">VISA PACKAGE</div>`);
  lines.push(`<div style="font-size:20px;font-weight:bold;color:#D00000;margin:5px 0;">₹30,000 - ₹35,000</div>`);
  lines.push(`<div style="font-size:11px;color:#6b7280;text-decoration:line-through;">Was ₹40,000</div>`);
  lines.push(`<div style="font-size:12px;color:#6b7280;margin-top:5px;">Admission + visa file & guidance</div>`);
  lines.push(`</div>`);
  lines.push(`</div>`);
  lines.push(`<a href="https://publicgermany.vercel.app/services" style="display:inline-block;margin-top:15px;padding:12px 24px;background:#78350f;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Claim Your Offer →</a>`);
  lines.push(`</div>`);
  
  // Feature 1: Application Tracking
  lines.push(`<div style="background:#f8f9fa;border-left:4px solid #D00000;padding:15px;margin:20px 0;">`);
  lines.push(`<h3 style="margin:0 0 10px 0;color:#D00000;">📋 Track Your Applications</h3>`);
  lines.push(`<p style="margin:0;line-height:1.6;">Keep all your university applications organized in one place. Get automatic deadline reminders so you never miss an important date!</p>`);
  lines.push(`<a href="https://publicgermany.vercel.app/applications" style="display:inline-block;margin-top:10px;padding:8px 16px;background:#D00000;color:white;text-decoration:none;border-radius:4px;">View My Applications →</a>`);
  lines.push(`</div>`);
  
  // Feature 2: Document Management
  lines.push(`<div style="background:#f8f9fa;border-left:4px solid #2563eb;padding:15px;margin:20px 0;">`);
  lines.push(`<h3 style="margin:0 0 10px 0;color:#2563eb;">📄 Document Preparation</h3>`);
  lines.push(`<p style="margin:0;line-height:1.6;">Upload and manage all your documents for APS, visa, and university applications. Our team reviews them and provides feedback.</p>`);
  lines.push(`<a href="https://publicgermany.vercel.app/dashboard" style="display:inline-block;margin-top:10px;padding:8px 16px;background:#2563eb;color:white;text-decoration:none;border-radius:4px;">Upload Documents →</a>`);
  lines.push(`</div>`);
  
  // Feature 3: Affordable Document Services
  lines.push(`<div style="background:#f8f9fa;border-left:4px solid #059669;padding:15px;margin:20px 0;">`);
  lines.push(`<h3 style="margin:0 0 10px 0;color:#059669;">💰 Affordable Document Preparation</h3>`);
  lines.push(`<p style="margin:0;line-height:1.6;margin-bottom:10px;">Get professional help with your documents at prices that won't break the bank:</p>`);
  lines.push(`<ul style="margin:5px 0;padding-left:20px;line-height:1.8;">`);
  lines.push(`<li><strong>APS Guidance:</strong> Step-by-step document preparation</li>`);
  lines.push(`<li><strong>University Shortlisting:</strong> Personalized recommendations</li>`);
  lines.push(`<li><strong>SOP/CV/LOR:</strong> Professional editing & feedback</li>`);
  lines.push(`<li><strong>Visa File Review:</strong> Complete document check</li>`);
  lines.push(`</ul>`);
  lines.push(`<a href="https://publicgermany.vercel.app/services" style="display:inline-block;margin-top:10px;padding:8px 16px;background:#059669;color:white;text-decoration:none;border-radius:4px;">View All Services →</a>`);
  lines.push(`</div>`);
  
  // Free Features Section
  lines.push(`<div style="background:#dbeafe;border:2px solid #3b82f6;border-radius:8px;padding:20px;margin:20px 0;">`);
  lines.push(`<h3 style="margin:0 0 15px 0;color:#1e40af;text-align:center;">🎁 Always Free Features</h3>`);
  lines.push(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">`);
  lines.push(`<div style="background:white;padding:12px;border-radius:6px;">`);
  lines.push(`<div style="font-size:20px;margin-bottom:5px;">📧</div>`);
  lines.push(`<div style="font-size:13px;font-weight:600;color:#1e40af;">Email Alerts</div>`);
  lines.push(`<div style="font-size:11px;color:#6b7280;">Deadline reminders</div>`);
  lines.push(`</div>`);
  lines.push(`<div style="background:white;padding:12px;border-radius:6px;">`);
  lines.push(`<div style="font-size:20px;margin-bottom:5px;">📊</div>`);
  lines.push(`<div style="font-size:13px;font-weight:600;color:#1e40af;">Excel Import/Export</div>`);
  lines.push(`<div style="font-size:11px;color:#6b7280;">Bulk manage apps</div>`);
  lines.push(`</div>`);
  lines.push(`<div style="background:white;padding:12px;border-radius:6px;">`);
  lines.push(`<div style="font-size:20px;margin-bottom:5px;">📋</div>`);
  lines.push(`<div style="font-size:13px;font-weight:600;color:#1e40af;">Progress Tracking</div>`);
  lines.push(`<div style="font-size:11px;color:#6b7280;">Monitor your journey</div>`);
  lines.push(`</div>`);
  lines.push(`<div style="background:white;padding:12px;border-radius:6px;">`);
  lines.push(`<div style="font-size:20px;margin-bottom:5px;">📁</div>`);
  lines.push(`<div style="font-size:13px;font-weight:600;color:#1e40af;">Document Storage</div>`);
  lines.push(`<div style="font-size:11px;color:#6b7280;">Upload & organize</div>`);
  lines.push(`</div>`);
  lines.push(`</div>`);
  lines.push(`<p style="text-align:center;margin:15px 0 0 0;font-size:13px;color:#1e40af;"><strong>Pay only if you need personalized help!</strong></p>`);
  lines.push(`</div>`);
  
  // Tips Section
  lines.push(`<div style="background:#fff3cd;border:1px solid #ffc107;padding:15px;margin:20px 0;border-radius:4px;">`);
  lines.push(`<h3 style="margin:0 0 10px 0;color:#856404;">💡 Pro Tip of the Week</h3>`);
  lines.push(`<p style="margin:0;line-height:1.6;color:#856404;">Start your university applications at least 6 months before the semester begins. This gives you enough time to prepare documents, take required tests, and handle any unexpected delays!</p>`);
  lines.push(`</div>`);
  
  // Testimonials Section
  lines.push(`<div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;">`);
  lines.push(`<h3 style="margin:0 0 15px 0;color:#1f2937;text-align:center;">⭐ Real Student Success Stories</h3>`);
  lines.push(`<p style="text-align:center;font-size:13px;color:#6b7280;margin:0 0 20px 0;">Authentic testimonials from students who reached Germany with our guidance</p>`);
  
  // Testimonial 1
  lines.push(`<div style="background:white;border-left:4px solid #10b981;padding:15px;margin:10px 0;border-radius:4px;">`);
  lines.push(`<div style="display:flex;align-items:center;margin-bottom:8px;">`);
  lines.push(`<div style="background:#10b981;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;margin-right:10px;">S</div>`);
  lines.push(`<div>`);
  lines.push(`<div style="font-weight:600;font-size:14px;">Shubham Kumar</div>`);
  lines.push(`<div style="font-size:11px;color:#6b7280;">⭐⭐⭐⭐⭐ • Visa Approved • Sep 2025</div>`);
  lines.push(`</div>`);
  lines.push(`</div>`);
  lines.push(`<p style="margin:0;font-size:13px;line-height:1.6;color:#374151;">Visa Approved! B.Eng. Logistics at THWS. I completed my bachelor's through distance learning from IGNOU, which was not sufficient initially, but publicGermany helped me navigate the entire process successfully!</p>`);
  lines.push(`</div>`);
  
  // Testimonial 2
  lines.push(`<div style="background:white;border-left:4px solid #10b981;padding:15px;margin:10px 0;border-radius:4px;">`);
  lines.push(`<div style="display:flex;align-items:center;margin-bottom:8px;">`);
  lines.push(`<div style="background:#10b981;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;margin-right:10px;">P</div>`);
  lines.push(`<div>`);
  lines.push(`<div style="font-weight:600;font-size:14px;">Parth Takkar</div>`);
  lines.push(`<div style="font-size:11px;color:#6b7280;">⭐⭐⭐⭐⭐ • University Shortlisting • Sep 2025</div>`);
  lines.push(`</div>`);
  lines.push(`</div>`);
  lines.push(`<p style="margin:0;font-size:13px;line-height:1.6;color:#374151;">Really professional. Opted for University Shortlisting as per my profile and needs. Was always up for any query. Got a proper formatted spreadsheet in 3 days. Highly recommended!</p>`);
  lines.push(`</div>`);
  
  lines.push(`<div style="text-align:center;margin-top:15px;">`);
  lines.push(`<a href="https://publicgermany.vercel.app/#testimonials" style="color:#D00000;text-decoration:none;font-size:13px;font-weight:600;">Read More Success Stories →</a>`);
  lines.push(`</div>`);
  lines.push(`</div>`);
  
  // Quick Stats
  lines.push(`<div style="margin:30px 0;text-align:center;">`);
  lines.push(`<p style="font-size:14px;color:#6b7280;margin-bottom:15px;">📊 <strong>Trusted by Students</strong></p>`);
  lines.push(`<div style="display:flex;justify-content:space-around;flex-wrap:wrap;">`);
  lines.push(`<div style="flex:1;min-width:120px;padding:10px;">`);
  lines.push(`<div style="font-size:24px;font-weight:bold;color:#D00000;">50+</div>`);
  lines.push(`<div style="font-size:12px;color:#6b7280;">Students Guided</div>`);
  lines.push(`</div>`);
  lines.push(`<div style="flex:1;min-width:120px;padding:10px;">`);
  lines.push(`<div style="font-size:24px;font-weight:bold;color:#2563eb;">400+</div>`);
  lines.push(`<div style="font-size:12px;color:#6b7280;">Universities</div>`);
  lines.push(`</div>`);
  lines.push(`<div style="flex:1;min-width:120px;padding:10px;">`);
  lines.push(`<div style="font-size:24px;font-weight:bold;color:#059669;">1.5+</div>`);
  lines.push(`<div style="font-size:12px;color:#6b7280;">Years Experience</div>`);
  lines.push(`</div>`);
  lines.push(`</div>`);
  lines.push(`</div>`);
  
  // Call to Action
  lines.push(`<div style="text-align:center;margin:30px 0;">`);
  lines.push(`<p style="font-size:16px;margin-bottom:15px;">Ready to take the next step?</p>`);
  lines.push(`<a href="https://publicgermany.vercel.app/dashboard" style="display:inline-block;padding:12px 30px;background:#D00000;color:white;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;">Go to Dashboard →</a>`);
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
