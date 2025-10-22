import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Cron Job for sending deadline reminders
 * Configure in vercel.json to run daily at 9 AM
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Allow requests from Vercel Cron, EasyCron, or with Bearer token
  const userAgent = String(req.headers['user-agent'] || '');
  const isVercelCron = userAgent.includes('vercel-cron');
  const isEasyCron = userAgent.includes('EasyCron') || userAgent.includes('curl');
  const cronSecret = process.env.CRON_SECRET || '';
  const authHeader = req.headers.authorization;
  const hasValidToken = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!(isVercelCron || isEasyCron || hasValidToken)) {
    console.log('Auth check failed. User-Agent:', userAgent);
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
