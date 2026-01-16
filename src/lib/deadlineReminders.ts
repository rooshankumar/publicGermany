import { supabase } from '@/integrations/supabase/client';
import { sendEmail } from './sendEmail';
import { wrapInEmailTemplate, getPersonalizedGreeting, signOffs } from './emailTemplate';

interface Application {
  id: string;
  user_id: string;
  university_name: string;
  program_name: string;
  end_date: string;
  start_date: string | null;
  application_method: string | null;
  portal_link: string | null;
}

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
}

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

    // Calculate reminder dates
    const reminderDays = [14, 7, 3, 2, 1]; // 2 weeks, 1 week, 3 days, 2 days, 1 day
    const reminderDates = reminderDays.map(days => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    });

    console.log('🔔 Checking deadlines for dates:', reminderDates);

    // Get all applications with deadlines matching reminder dates
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('id, user_id, university_name, program_name, end_date, start_date, application_method, portal_link')
      .in('end_date', reminderDates)
      .in('status', ['draft', 'submitted']); // Only remind for active applications

    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return;
    }

    if (!applications || applications.length === 0) {
      console.log('✅ No deadlines to remind today');
      console.log('ℹ️  Checked dates:', reminderDates);
      return;
    }

    console.log(`📧 Found ${applications.length} applications with upcoming deadlines`);
    console.log('📋 Applications:', applications.map(a => ({
      university: a.university_name,
      deadline: a.end_date,
      user_id: a.user_id
    })));

    // Group applications by user
    const userApplications = new Map<string, Application[]>();
    applications.forEach((app: any) => {
      if (!userApplications.has(app.user_id)) {
        userApplications.set(app.user_id, []);
      }
      userApplications.get(app.user_id)!.push(app);
    });

    // Get user profiles and their auth emails
    const userIds = Array.from(userApplications.keys());
    
    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    if (profilesError || !profiles) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`👥 Found ${profiles.length} user profiles`);

    // Get auth users to get emails
    const profilesWithEmails: UserProfile[] = [];
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
  }
}

/**
 * Send deadline reminder email to a user
 */
async function sendDeadlineReminderEmail(
  profile: UserProfile,
  applications: Application[],
  today: Date
) {
  try {
    // Sort applications by deadline
    applications.sort((a, b) => 
      new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
    );

    // Build email content
    const contentParts: string[] = [];
    
    contentParts.push(`This is a friendly reminder about your upcoming application deadlines:<br/><br/>`);
    
    contentParts.push(`<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">`);
    contentParts.push(`<thead>`);
    contentParts.push(`<tr style="background: #f3f4f6;">`);
    contentParts.push(`<th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">University</th>`);
    contentParts.push(`<th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Program</th>`);
    contentParts.push(`<th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Deadline</th>`);
    contentParts.push(`<th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Days Left</th>`);
    contentParts.push(`</tr>`);
    contentParts.push(`</thead>`);
    contentParts.push(`<tbody>`);

    for (const app of applications) {
      const deadline = new Date(app.end_date);
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const urgency = daysLeft <= 3 ? 'background: #fef2f2;' : '';
      
      contentParts.push(`<tr style="${urgency}">`);
      contentParts.push(`<td style="padding: 10px; border: 1px solid #e5e7eb;">${app.university_name}</td>`);
      contentParts.push(`<td style="padding: 10px; border: 1px solid #e5e7eb;">${app.program_name}</td>`);
      contentParts.push(`<td style="padding: 10px; border: 1px solid #e5e7eb;">${formatDate(app.end_date)}</td>`);
      contentParts.push(`<td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: ${daysLeft <= 3 ? '#dc2626' : '#059669'};">${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}</td>`);
      contentParts.push(`</tr>`);
    }

    contentParts.push(`</tbody>`);
    contentParts.push(`</table><br/>`);

    contentParts.push(`📌 <strong>Quick Actions:</strong><br/>`);
    contentParts.push(`• View all your applications: <a href="https://publicgermany.vercel.app/applications" style="color: #0066cc;">Applications Dashboard</a><br/>`);
    contentParts.push(`• Check application portals and submit your documents<br/>`);
    contentParts.push(`• Ensure all required tests are completed<br/><br/>`);

    contentParts.push(`💡 <em>Tip: Apply early to avoid last-minute technical issues!</em><br/><br/>`);
    contentParts.push(`Good luck with your applications! 🎓`);

    const html = wrapInEmailTemplate(contentParts.join(''), {
      customGreeting: getPersonalizedGreeting(profile.full_name || 'there'),
      signOff: signOffs.team
    });

    // Determine subject based on urgency
    const mostUrgent = applications[0];
    const mostUrgentDeadline = new Date(mostUrgent.end_date);
    const daysLeft = Math.ceil((mostUrgentDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let subject = '';
    if (daysLeft === 1) {
      subject = '🚨 URGENT: Application Deadline Tomorrow!';
    } else if (daysLeft === 2) {
      subject = '⚠️ Application Deadline in 2 Days!';
    } else if (daysLeft === 3) {
      subject = '⏰ Application Deadline in 3 Days';
    } else if (daysLeft === 7) {
      subject = '📅 Application Deadline in 1 Week';
    } else if (daysLeft === 14) {
      subject = '📋 Application Deadline in 2 Weeks';
    } else {
      subject = `📌 Upcoming Application Deadline${applications.length > 1 ? 's' : ''}`;
    }

    await sendEmail(profile.email, subject, html);

    console.log(`✅ Sent reminder to ${profile.email} for ${applications.length} application(s)`);
  } catch (error) {
    console.error(`❌ Error sending email to ${profile.email}:`, error);
  }
}

/**
 * Format date as "Jan 15, 2025"
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}
