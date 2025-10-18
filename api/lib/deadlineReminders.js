import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Check for upcoming deadlines and send email reminders
 * Should be called daily (e.g., via cron job or scheduled function)
 */
export async function sendDeadlineReminders() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🔔 Starting deadline reminder check at:', new Date().toISOString());
    console.log('📅 Today (local):', today.toISOString().split('T')[0]);

    // Calculate reminder dates for deadlines (end_date)
    const deadlineReminderDays = [30, 14, 7, 3, 2, 1]; // 30 days, 2 weeks, 1 week, 3 days, 2 days, 1 day
    const deadlineReminderDates = deadlineReminderDays.map(days => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    });

    console.log('🔔 Checking deadlines for dates:', deadlineReminderDates);

    // Calculate reminder dates for application start dates
    const startReminderDays = [30, 14, 7, 1]; // 30 days, 2 weeks, 1 week, 1 day before opening
    const startReminderDates = startReminderDays.map(days => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    });

    console.log('🔔 Checking start dates for:', startReminderDates);

    // Get applications with deadlines OR start dates matching reminder dates
    const { data: deadlineApps, error: deadlineError } = await supabase
      .from('applications')
      .select('id, user_id, university_name, program_name, end_date, start_date, application_method, portal_link')
      .in('end_date', deadlineReminderDates)
      .in('status', ['draft', 'submitted']);

    const { data: startApps, error: startError } = await supabase
      .from('applications')
      .select('id, user_id, university_name, program_name, end_date, start_date, application_method, portal_link')
      .in('start_date', startReminderDates)
      .in('status', ['draft', 'submitted']);

    if (deadlineError || startError) {
      console.error('Error fetching applications:', deadlineError || startError);
      return;
    }

    // Combine and deduplicate applications
    const allAppsMap = new Map();
    [...(deadlineApps || []), ...(startApps || [])].forEach(app => {
      allAppsMap.set(app.id, app);
    });
    const applications = Array.from(allAppsMap.values());

    if (!applications || applications.length === 0) {
      console.log('✅ No reminders to send today');
      console.log('ℹ️  Checked deadline dates:', deadlineReminderDates);
      console.log('ℹ️  Checked start dates:', startReminderDates);
      return;
    }

    console.log(`📧 Found ${applications.length} applications with upcoming deadlines`);
    console.log('📋 Applications:', applications.map(a => ({
      university: a.university_name,
      deadline: a.end_date,
      user_id: a.user_id
    })));

    // Group applications by user
    const userApplications = new Map();
    applications.forEach((app) => {
      if (!userApplications.has(app.user_id)) {
        userApplications.set(app.user_id, []);
      }
      userApplications.get(app.user_id).push(app);
    });

    // Get user profiles and their auth emails
    const userIds = Array.from(userApplications.keys());
    
    // Get profiles
    const { data: profiles, error: profilesError} = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    if (profilesError || !profiles) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`👥 Found ${profiles.length} user profiles`);

    // Get auth users to get emails
    const profilesWithEmails = [];
    for (const profile of profiles) {
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
      if (authError) {
        console.error(`❌ Error fetching auth data for user ${profile.user_id}:`, authError);
        continue;
      }
      if (authData?.user?.email) {
        profilesWithEmails.push({
          user_id: profile.user_id,
          email: authData.user.email,
          full_name: profile.full_name || 'Student'
        });
        console.log(`✅ Found email for user ${profile.user_id}: ${authData.user.email}`);
      } else {
        console.warn(`⚠️  No email found for user ${profile.user_id}`);
      }
    }

    // Send emails to each user
    console.log(`📤 Sending emails to ${profilesWithEmails.length} users...`);
    let successCount = 0;
    let failCount = 0;
    
    for (const profile of profilesWithEmails) {
      const apps = userApplications.get(profile.user_id);
      if (!apps) continue;

      try {
        await sendDeadlineReminderEmail(profile, apps, today);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to send email to ${profile.email}:`, error);
        failCount++;
      }
    }

    console.log(`✅ Deadline reminders completed: ${successCount} sent, ${failCount} failed`);
  } catch (error) {
    console.error('❌ Error sending deadline reminders:', error);
    throw error;
  }
}

/**
 * Send deadline reminder email to a user
 */
async function sendDeadlineReminderEmail(profile, applications, today) {
  try {
    // Separate applications into opening soon and deadline approaching
    const openingSoon = [];
    const deadlineApproaching = [];
    
    applications.forEach(app => {
      if (app.start_date) {
        const startDate = new Date(app.start_date);
        const daysToStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToStart > 0 && daysToStart <= 30) {
          openingSoon.push({ ...app, daysToStart });
        }
      }
      
      const deadline = new Date(app.end_date);
      const daysToDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysToDeadline > 0 && daysToDeadline <= 30) {
        deadlineApproaching.push({ ...app, daysToDeadline });
      }
    });

    // Sort by days remaining
    openingSoon.sort((a, b) => a.daysToStart - b.daysToStart);
    deadlineApproaching.sort((a, b) => a.daysToDeadline - b.daysToDeadline);

    // Build email content
    const lines = [];
    
    lines.push(`<p>Hi ${profile.full_name || 'there'},</p>`);
    
    // Opening Soon Section
    if (openingSoon.length > 0) {
      lines.push(`<h3 style="color: #2563eb; margin-top: 20px;">🎯 Applications Opening Soon</h3>`);
      lines.push(`<p>Get ready! These application periods will open soon:</p>`);
      
      lines.push(`<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">`);
      lines.push(`<thead>`);
      lines.push(`<tr style="background: #dbeafe;">`);
      lines.push(`<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">University</th>`);
      lines.push(`<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Program</th>`);
      lines.push(`<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Opens On</th>`);
      lines.push(`<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Days Until</th>`);
      lines.push(`</tr>`);
      lines.push(`</thead>`);
      lines.push(`<tbody>`);

      for (const app of openingSoon) {
        lines.push(`<tr>`);
        lines.push(`<td style="padding: 12px; border: 1px solid #e5e7eb;">${app.university_name}</td>`);
        lines.push(`<td style="padding: 12px; border: 1px solid #e5e7eb;">${app.program_name}</td>`);
        lines.push(`<td style="padding: 12px; border: 1px solid #e5e7eb;">${formatDate(app.start_date)}</td>`);
        lines.push(`<td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #2563eb;">${app.daysToStart} ${app.daysToStart === 1 ? 'day' : 'days'}</td>`);
        lines.push(`</tr>`);
      }

      lines.push(`</tbody>`);
      lines.push(`</table>`);
    }

    // Deadline Approaching Section
    if (deadlineApproaching.length > 0) {
      lines.push(`<h3 style="color: #dc2626; margin-top: 30px;">⏰ Application Deadlines Approaching</h3>`);
      lines.push(`<p>Don't miss these upcoming deadlines:</p>`);
      
      lines.push(`<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">`);
      lines.push(`<thead>`);
      lines.push(`<tr style="background: #f3f4f6;">`);
      lines.push(`<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">University</th>`);
      lines.push(`<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Program</th>`);
      lines.push(`<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Deadline</th>`);
      lines.push(`<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Days Left</th>`);
      lines.push(`</tr>`);
      lines.push(`</thead>`);
      lines.push(`<tbody>`);

      for (const app of deadlineApproaching) {
        const urgency = app.daysToDeadline <= 3 ? 'background: #fef2f2;' : '';
        
        lines.push(`<tr style="${urgency}">`);
        lines.push(`<td style="padding: 12px; border: 1px solid #e5e7eb;">${app.university_name}</td>`);
        lines.push(`<td style="padding: 12px; border: 1px solid #e5e7eb;">${app.program_name}</td>`);
        lines.push(`<td style="padding: 12px; border: 1px solid #e5e7eb;">${formatDate(app.end_date)}</td>`);
        lines.push(`<td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; color: ${app.daysToDeadline <= 3 ? '#dc2626' : '#059669'};">${app.daysToDeadline} ${app.daysToDeadline === 1 ? 'day' : 'days'}</td>`);
        lines.push(`</tr>`);
      }
    }

    lines.push(`</tbody>`);
    lines.push(`</table>`);

    lines.push(`<p style="margin-top: 20px;">📌 <strong>Quick Actions:</strong></p>`);
    lines.push(`<ul style="margin: 10px 0;">`);
    lines.push(`<li>View all your applications: <a href="https://publicgermany.vercel.app/applications" style="color: #0066cc;">Applications Dashboard</a></li>`);
    lines.push(`<li>Check application portals and submit your documents</li>`);
    lines.push(`<li>Ensure all required tests are completed</li>`);
    lines.push(`</ul>`);

    lines.push(`<p style="margin-top: 20px; color: #6b7280; font-size: 14px;">💡 <em>Tip: Apply early to avoid last-minute technical issues!</em></p>`);
    
    lines.push(`<p style="margin-top: 30px;">Good luck with your applications! 🎓</p>`);
    lines.push(`<p>— publicGermany Team</p>`);

    const html = lines.join('\n');
    
    // Create dynamic subject based on what's in the email
    let subject = '📬 Application Reminder';
    if (openingSoon.length > 0 && deadlineApproaching.length > 0) {
      subject = `🎯 ${openingSoon.length} Opening Soon & ⏰ ${deadlineApproaching.length} Deadline${deadlineApproaching.length > 1 ? 's' : ''} Approaching`;
    } else if (openingSoon.length > 0) {
      subject = `🎯 ${openingSoon.length} Application${openingSoon.length > 1 ? 's' : ''} Opening Soon`;
    } else if (deadlineApproaching.length > 0) {
      subject = `⏰ ${deadlineApproaching.length} Deadline${deadlineApproaching.length > 1 ? 's' : ''} Approaching`;
    }

    // Call Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: profile.email,
        subject,
        html
      }
    });

    if (error) {
      throw error;
    }

    console.log(`✅ Sent reminder to ${profile.email} for ${applications.length} application(s)`);
  } catch (error) {
    console.error(`❌ Error sending email to ${profile.email}:`, error);
    throw error;
  }
}

/**
 * Format date as "Jan 15, 2025"
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}
