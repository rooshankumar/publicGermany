# Test Email Alerts - Quick Guide

## ✅ DEPLOYMENT SUCCESSFUL!

The Edge Function `remind-deadlines` has been deployed with the fix.

## How to Test

### Option 1: Wait for Automatic Cron (Recommended for Production)
The Vercel cron job runs daily at **12:30 AM UTC (6:00 AM IST)**.

If you have applications with deadlines in **1, 3, 7, 14, or 30 days**, you'll receive emails automatically tomorrow morning.

### Option 2: Manual Test via Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/rzbnrlfujjxyrypbafdp/functions)
2. Select **remind-deadlines** function
3. Click **Invoke** button
4. Check the logs to see if emails were sent

### Option 3: Test via API Endpoint (Local Development)
```powershell
# Start your dev server
npm run dev

# In another terminal, test the reminder system
curl http://localhost:5173/api/test-deadline-reminders
```

## Verify Email Was Sent

### Check Email Logs in Admin Dashboard
1. Login to your app as admin
2. Go to **Admin Dashboard** → **Email Logs**
3. Look for recent entries with:
   - Subject containing "Reminder" or "Deadline"
   - Status: `success` or `error`
   - Check the error message if status is `error`

### Check Your Email Inbox
- Check your inbox (and spam folder)
- Look for emails from `publicgermany@outlook.com`
- Subject will be like: "Reminder: [University] deadline in X days"

## Create a Test Application

To test immediately, create an application with a deadline **1 day from today**:

1. Login to your app
2. Go to **Applications** page
3. Click **Add Application**
4. Fill in:
   - University Name: Test University
   - Program Name: Test Program
   - **Application End Date: [Tomorrow's date]**
   - Status: `draft` or `submitted`
5. Save the application

Then run the manual test (Option 2 or 3 above).

## Expected Behavior

### If Deadline is 1 Day Away:
- ✅ Email sent with subject: "Reminder: Test University deadline in 1 day"
- ✅ Email contains university name, program, deadline date
- ✅ Email logged in Admin → Email Logs

### If Deadline is NOT 1, 3, 7, 14, or 30 Days Away:
- ℹ️ No email sent (this is expected behavior)
- ℹ️ Logs will show: "No reminders to send today"

## Troubleshooting

### "No reminders to send today"
**This is normal!** It means:
- No applications have deadlines exactly 1, 3, 7, 14, or 30 days from today
- Create a test application with tomorrow's deadline to test

### Email shows "error" status in logs
Check the error message in Email Logs. Common issues:
- Brevo API key invalid
- Email address doesn't exist
- Brevo account in sandbox mode

### No email received but logs show "success"
- Check spam/junk folder
- Verify email address in your profile
- Check Brevo dashboard to confirm delivery

## Next Steps

1. **Create a test application** with tomorrow's deadline
2. **Run manual test** via Supabase Dashboard
3. **Check Email Logs** in admin dashboard
4. **Verify email received** in your inbox
5. **Wait for automatic cron** tomorrow at 6:00 AM IST

## Summary

✅ **Bug Fixed**: Column name mismatch resolved  
✅ **Deployed**: Edge Function updated in production  
✅ **Secrets**: All configured correctly  
✅ **Cron**: Scheduled to run daily  

**The system should now work!** Test it with a deadline 1 day away to confirm.
