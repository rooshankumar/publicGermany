import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Cron Job for sending deadline reminders
 * Configure in vercel.json to run daily at 9 AM
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Allow all cron requests (EasyCron, Vercel Cron, etc.)
  console.log('🔔 Cron job triggered from:', req.headers['user-agent'] || 'unknown');
  console.log('⏰ Timestamp:', new Date().toISOString());

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
