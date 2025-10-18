# Deadline Reminders - Debugging Guide

## How Email Reminders Work

The system sends email reminders for application deadlines at these intervals:
- **14 days** before deadline
- **7 days** before deadline
- **3 days** before deadline
- **2 days** before deadline
- **1 day** before deadline

## Cron Schedule

- **Schedule**: `30 0 * * *` (runs at 12:30 AM UTC)
- **IST Time**: 6:00 AM IST (UTC+5:30)
- **Configured in**: `vercel.json`

## Why You Might Not Receive Emails

### 1. **Deadline Timing**
Check if your deadline falls on one of the reminder days (14, 7, 3, 2, or 1 day from today).

**Example**: If today is Oct 18, 2025:
- Oct 19 (1 day) ✅
- Oct 20 (2 days) ✅
- Oct 21 (3 days) ✅
- Oct 25 (7 days) ✅
- Nov 1 (14 days) ✅

### 2. **Application Status**
Only applications with status `draft` or `submitted` receive reminders.
- Check your application status in the database

### 3. **Email Configuration**
- Verify Supabase email function is configured
- Check if `send-email` edge function is deployed
- Verify email service credentials (Resend, SendGrid, etc.)

### 4. **Cron Job Not Running**
- Verify cron job is enabled in Vercel dashboard
- Check Vercel logs for cron execution
- Ensure `CRON_SECRET` environment variable is set

### 5. **User Profile Issues**
- User must have a valid email in Supabase Auth
- User must have a profile record in the `profiles` table

## Testing Email Reminders

### Option 1: Manual Test Endpoint

You can manually trigger the reminder system without waiting for the cron:

```bash
# Using curl (with authorization)
curl -X GET https://your-domain.vercel.app/api/test-deadline-reminders \
  -H "Authorization: Bearer your-test-secret"

# Or visit in browser (in development mode)
http://localhost:5173/api/test-deadline-reminders
```

### Option 2: Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Logs** tab
4. Filter by `/api/cron/deadline-reminders`
5. Look for error messages or execution logs

### Option 3: Local Testing

Run the test endpoint locally:

```bash
# Start your dev server
npm run dev

# In another terminal, trigger the test
curl http://localhost:5173/api/test-deadline-reminders
```

## Debugging Checklist

- [ ] Verify deadline is 1, 2, 3, 7, or 14 days away
- [ ] Check application status is `draft` or `submitted`
- [ ] Confirm user email exists in Supabase Auth
- [ ] Verify Supabase `send-email` function is deployed
- [ ] Check Vercel cron logs for errors
- [ ] Ensure `CRON_SECRET` environment variable is set
- [ ] Test manually using `/api/test-deadline-reminders`
- [ ] Check spam/junk folder for emails

## Environment Variables Required

```env
# Vercel Environment Variables
CRON_SECRET=your-secret-key-here
TEST_SECRET=test-secret-123

# Supabase (should already be configured)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Common Issues & Solutions

### Issue: "No deadlines to remind today"
**Solution**: Your deadlines don't fall on reminder days. Adjust deadlines or wait for the right day.

### Issue: "Error fetching applications"
**Solution**: Check Supabase connection and table permissions.

### Issue: "No email found for user"
**Solution**: User needs to be authenticated with an email address.

### Issue: "Failed to send email"
**Solution**: 
1. Check Supabase Edge Function logs
2. Verify email service API keys
3. Ensure email service is not in sandbox mode

## Viewing Logs

### Vercel Logs
```bash
vercel logs your-project-name --follow
```

### Supabase Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select `send-email` function
4. View logs tab

## Next Steps

1. **Deploy the changes**: Push to GitHub and deploy to Vercel
2. **Test immediately**: Use `/api/test-deadline-reminders` endpoint
3. **Monitor logs**: Check Vercel logs tomorrow at 6:00 AM IST
4. **Verify email**: Check your inbox and spam folder

## Support

If issues persist:
1. Check all environment variables are set in Vercel
2. Verify Supabase email function is working
3. Test with a simple deadline (1 day away)
4. Review Vercel and Supabase logs for specific errors
