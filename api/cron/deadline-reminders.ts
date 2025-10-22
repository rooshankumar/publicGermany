import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Cron Job for sending deadline reminders
 * Configure in vercel.json to run daily at 9 AM
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET || '';
  const authHeader = req.headers.authorization;
  const isVercelCron = Boolean((req.headers as any)['x-vercel-cron']);

  if (!(isVercelCron || (cronSecret && authHeader === `Bearer ${cronSecret}`))) {
    return res.status(401).json({ error: 'Unauthorized - missing x-vercel-cron or valid Authorization' });
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
