import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Manual test endpoint for deadline reminders
 * Use this to test email alerts without waiting for the cron job
 * 
 * Usage: GET /api/test-deadline-reminders
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow in development or with secret key
  const isDev = process.env.NODE_ENV === 'development';
  const testSecret = process.env.TEST_SECRET || 'test-secret-123';
  const authHeader = req.headers.authorization;

  if (!isDev && authHeader !== `Bearer ${testSecret}`) {
    return res.status(401).json({ error: 'Unauthorized - Use Bearer token or run in development' });
  }

  try {
    // Import the deadline reminders function
    const { sendDeadlineReminders } = await import('./lib/deadlineReminders.js');
    
    console.log('🧪 Manual test: Sending deadline reminders...');
    await sendDeadlineReminders();

    return res.status(200).json({ 
      success: true, 
      message: 'Test completed! Check your email and server logs.',
      timestamp: new Date().toISOString(),
      note: 'Emails sent for deadlines in 30, 14, 7, 3, 2, or 1 days from today'
    });
  } catch (error: any) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to send test reminders',
      message: error.message 
    });
  }
}
