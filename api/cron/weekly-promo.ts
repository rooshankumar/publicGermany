import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Cron Job for sending weekly promotional emails
 * Configure in vercel.json to run weekly (e.g., every Monday at 9 AM)
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Call Supabase Edge Function to send promotional emails
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-weekly-promo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send promotional emails');
    }

    console.log('✅ Weekly promotional emails sent:', data);

    return res.status(200).json({ 
      success: true, 
      message: 'Weekly promotional emails sent successfully',
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in weekly promo cron job:', error);
    return res.status(500).json({ 
      error: 'Failed to send weekly promotional emails',
      message: error.message 
    });
  }
}
