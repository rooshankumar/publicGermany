import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Manual test endpoint for weekly promotional emails
 * Use this to test promotional emails without waiting for the cron job
 * 
 * Usage: GET /api/test-weekly-promo
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
    // Call Supabase Edge Function to send promotional emails
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    console.log('🧪 Manual test: Sending weekly promotional emails...');

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

    console.log('✅ Test completed:', data);

    return res.status(200).json({ 
      success: true, 
      message: 'Test completed! Check your email and server logs.',
      data,
      timestamp: new Date().toISOString(),
      note: 'Promotional emails sent to all students'
    });
  } catch (error: any) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to send test promotional emails',
      message: error.message 
    });
  }
}
