# Email Alerts Production Fix Guide

## Issue Summary
Email alerts for student applications are not working in production, even though they worked during testing.

## ✅ ROOT CAUSE FOUND

**The Supabase Edge Function was querying the wrong column name!**

- Database column: `end_date`
- Edge Function was looking for: `application_end_date`

This has been **FIXED** in the code. You now need to **redeploy the Edge Function**.

## Additional Issues That May Occur

### 1. **Supabase Edge Function Secrets Not Set**
The `send-email` Edge Function requires these secrets to be configured in Supabase:

```bash
# Required Secrets (must be set in Supabase Dashboard)
BREVO_API_KEY=your-brevo-api-key
FROM_EMAIL=publicgermany@outlook.com
FROM_NAME=publicGermany
SUPABASE_URL=https://rzbnrlfujjxyrypbafdp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**How to Set Secrets:**
1. Go to Supabase Dashboard → Your Project
2. Navigate to **Edge Functions** → **send-email**
3. Click on **Secrets** tab
4. Add each secret listed above

### 2. **Edge Function Not Deployed**
The `send-email` function must be deployed to Supabase.

**How to Deploy:**
```powershell
# From project root
supabase functions deploy send-email
```

### 3. **Vercel Cron Job Not Configured**
The cron job runs daily at 12:30 AM UTC (6:00 AM IST) but requires:

**Required Environment Variables in Vercel:**
```env
CRON_SECRET=your-secret-key-here
VITE_SUPABASE_URL=https://rzbnrlfujjxyrypbafdp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**How to Set in Vercel:**
1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for **Production** environment
4. Redeploy the project

### 4. **Application Deadlines Don't Match Reminder Days**
Emails are only sent when deadlines are exactly **30, 14, 7, 3, 2, or 1 day(s)** away.

**Example:** If today is October 19, 2025:
- ✅ Deadline on October 20 (1 day) → Email sent
- ✅ Deadline on October 22 (3 days) → Email sent
- ✅ Deadline on October 26 (7 days) → Email sent
- ❌ Deadline on October 24 (5 days) → No email
- ❌ Deadline on October 30 (11 days) → No email

### 5. **Application Status**
Only applications with status `draft` or `submitted` receive reminders.
- ❌ Applications with status `accepted`, `rejected`, `waitlisted` won't get reminders

## How to Fix (CRITICAL - DO THIS NOW)

### Step 1: Deploy the Fixed Edge Function
```powershell
# Login to Supabase CLI
supabase login

# Link your project
supabase link --project-ref rzbnrlfujjxyrypbafdp

# Deploy BOTH functions (the bug was in remind-deadlines)
supabase functions deploy remind-deadlines
supabase functions deploy send-email
```

**This is the most important step!** The code fix won't work until you deploy.

### Step 2: Verify Supabase Secrets (Already Done ✅)
You already have all the required secrets configured in Supabase:
- ✅ BREVO_API_KEY
- ✅ FROM_EMAIL
- ✅ FROM_NAME
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_ROLE_KEY

No action needed here!

### Step 3: Configure Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:
   - `CRON_SECRET` (create a strong random string)
   - `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Settings → API)
   - `VITE_SUPABASE_URL` (already set)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (already set)

### Step 4: Enable Vercel Cron
The cron is already configured in `vercel.json`, but ensure:
1. Your Vercel plan supports cron jobs (Pro plan required)
2. The project is deployed to production
3. Check Vercel Dashboard → Project → Cron Jobs to see if it's listed

### Step 5: Test Immediately
Don't wait for the cron! Test manually:

```powershell
# Option 1: Test locally
npm run dev
# Then visit: http://localhost:5173/api/test-deadline-reminders

# Option 2: Test in production
curl -X GET https://your-domain.vercel.app/api/test-deadline-reminders \
  -H "Authorization: Bearer your-test-secret"
```

## Verification Checklist

- [ ] **Supabase Edge Function deployed**
  - Check: Supabase Dashboard → Edge Functions → `send-email` exists
  
- [ ] **Supabase secrets configured**
  - Check: Edge Functions → send-email → Secrets tab
  - Verify: BREVO_API_KEY, FROM_EMAIL, FROM_NAME are set
  
- [ ] **Vercel environment variables set**
  - Check: Vercel Dashboard → Settings → Environment Variables
  - Verify: CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY are set
  
- [ ] **Test application with proper deadline**
  - Create a test application with deadline 1 day from today
  - Ensure status is `draft` or `submitted`
  
- [ ] **Run manual test**
  - Visit `/api/test-deadline-reminders`
  - Check console logs for success/errors
  
- [ ] **Check email logs**
  - Go to Admin Dashboard → Email Logs
  - Look for recent entries with status `success` or `error`
  
- [ ] **Verify Brevo API**
  - Login to Brevo dashboard
  - Check if emails are being sent
  - Ensure account is not in sandbox mode

## Monitoring

### Check Vercel Logs
```powershell
vercel logs your-project-name --follow
```

### Check Supabase Edge Function Logs
1. Supabase Dashboard → Edge Functions
2. Select `send-email`
3. View **Logs** tab

### Check Email Logs in App
1. Login as admin
2. Go to Admin Dashboard → Email Logs
3. Review recent email attempts

## Common Issues

### "Missing BREVO_API_KEY or FROM_EMAIL"
**Solution:** Set secrets in Supabase Edge Function

### "Unauthorized" when testing
**Solution:** Set TEST_SECRET in Vercel environment variables

### "No deadlines to remind today"
**Solution:** Your application deadlines don't fall on reminder days (30, 14, 7, 3, 2, or 1 day away)

### Emails not received
**Check:**
1. Spam/junk folder
2. Email logs show "success" status
3. Brevo dashboard shows email was sent
4. User email is correct in Supabase Auth

## Production Deployment Steps

1. **Commit and push changes** (if any code changes were made)
   ```powershell
   git add .
   git commit -m "Fix email alerts configuration"
   git push origin main
   ```

2. **Deploy Edge Function**
   ```powershell
   supabase functions deploy send-email
   ```

3. **Set all secrets and environment variables** (as described above)

4. **Test manually** using the test endpoint

5. **Monitor logs** for the next 24 hours to ensure cron runs successfully

## Support

If issues persist after following this guide:
1. Check Vercel logs for cron execution errors
2. Check Supabase Edge Function logs for API errors
3. Verify Brevo API key is valid and account is active
4. Ensure application deadlines are set correctly in the database
5. Test with a simple application deadline 1 day away

## Quick Test Command

```powershell
# Test the entire flow locally
npm run dev

# In another terminal
curl http://localhost:5173/api/test-deadline-reminders
```

Check your email inbox and the console logs for results.
