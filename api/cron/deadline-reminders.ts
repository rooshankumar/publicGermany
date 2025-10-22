import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Cron Job for sending deadline reminders
 * Configure in vercel.json to run daily at 9 AM
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Allow Vercel Cron (User-Agent: vercel-cron/1.0) or Bearer token
  const userAgent = String(req.headers['user-agent'] || '');
  const isVercelCron = userAgent.includes('vercel-cron');
  const cronSecret = process.env.CRON_SECRET || '';
  const authHeader = req.headers.authorization;
  const hasValidToken = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!(isVercelCron || hasValidToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Import the deadline reminders function
    const { sendDeadlineReminders } = await import('../lib/deadlineReminders.js');
    
    await sendDeadlineReminders();

    return res.status(200).json({ 
      success: true, 
      message: 'Deadline reminders sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in cron job:', error);
    return res.status(500).json({ 
      error: 'Failed to send deadline reminders',
      message: error.message 
    });
  }
}
