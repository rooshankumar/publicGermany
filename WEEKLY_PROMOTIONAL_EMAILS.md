# Weekly Promotional Emails Setup Guide

## Overview
Automatically send promotional/newsletter emails to all students once a week, similar to the deadline reminder system.

## Schedule
- **Frequency**: Once per week
- **Day**: Every Monday
- **Time**: 4:15 AM UTC (9:45 AM IST)
- **Configured in**: `vercel.json`

## How It Works

### 1. Vercel Cron Job
- Runs every Monday at 4:15 AM UTC (9:45 AM IST)
- Calls `/api/cron/weekly-promo` endpoint
- Protected by `CRON_SECRET` environment variable

### 2. API Endpoint
- Located at: `api/cron/weekly-promo.ts`
- Calls Supabase Edge Function `send-weekly-promo`
- Handles authentication and error logging

### 3. Supabase Edge Function
- Located at: `supabase/functions/send-weekly-promo/index.ts`
- Fetches all students from database
- Sends personalized promotional emails via Brevo
- Logs all email attempts to `emails_log` table

## Email Content

The promotional email includes:

### Header
- publicGermany branding
- Professional design with company colors

### Main Sections
1. **Application Tracking** - Promote the applications feature
2. **Document Management** - Highlight document upload/review
3. **Expert Services** - Showcase available services
4. **Pro Tip of the Week** - Educational content
5. **Quick Stats** - Show platform statistics (400+ universities, 1000+ programs)

### Call to Action
- Links to dashboard, applications, and services pages
- Encourages engagement with the platform

### Footer
- Contact information
- Unsubscribe notice (optional)
- Company branding

## Customizing Email Content

To customize the promotional email, edit the `buildPromotionalEmail()` function in:
```
supabase/functions/send-weekly-promo/index.ts
```

You can:
- Change the subject line (line 68)
- Modify email sections
- Add new features or promotions
- Update links and CTAs
- Change colors and styling

## Deployment Steps

### 1. Deploy Supabase Edge Function
```powershell
# Deploy the new function
supabase functions deploy send-weekly-promo
```

### 2. Push to Git and Deploy to Vercel
```powershell
git add .
git commit -m "Add weekly promotional email system"
git push origin main
```

Vercel will automatically:
- Deploy the new API endpoints
- Configure the cron job from `vercel.json`

### 3. Verify Cron Configuration
1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Cron Jobs**
3. Verify you see:
   - `/api/cron/deadline-reminders` - Daily at 00:30 UTC
   - `/api/cron/weekly-promo` - Weekly on Monday at 09:00 UTC

## Testing

### Option 1: Manual Test via API
```powershell
# Start dev server
npm run dev

# In another terminal
curl http://localhost:5173/api/test-weekly-promo
```

### Option 2: Test via Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/rzbnrlfujjxyrypbafdp/functions)
2. Select `send-weekly-promo` function
3. Click **Invoke** button
4. Check logs for results

### Option 3: Test in Production
```bash
curl -X GET https://your-domain.vercel.app/api/test-weekly-promo \
  -H "Authorization: Bearer your-test-secret"
```

## Verification

### Check Email Logs
1. Login as admin
2. Go to **Admin Dashboard** → **Email Logs**
3. Look for entries with:
   - Template: `weekly_promo`
   - Subject: "🎓 Your Weekly Update from publicGermany"
   - Status: `success` or `error`

### Check Your Inbox
- All students will receive the email
- Check spam folder if not in inbox
- Email comes from `publicgermany@outlook.com`

## Environment Variables

All required environment variables are already configured:

### Supabase Secrets (Already Set ✅)
- `BREVO_API_KEY`
- `FROM_EMAIL`
- `FROM_NAME`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Vercel Environment Variables (Already Set ✅)
- `CRON_SECRET`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Customization Ideas

### Change Schedule
Edit `vercel.json` to change when emails are sent:

```json
{
  "path": "/api/cron/weekly-promo",
  "schedule": "15 4 * * 1"  // Every Monday at 4:15 AM UTC (9:45 AM IST)
}
```

**Common schedules:**
- `15 4 * * 1` - Every Monday at 9:45 AM IST
- `0 9 * * 1` - Every Monday at 2:30 PM IST
- `0 9 * * 5` - Every Friday at 2:30 PM IST
- `0 9 1 * *` - First day of every month at 2:30 PM IST
- `0 9 1,15 * *` - 1st and 15th of every month at 2:30 PM IST

### Add Personalization
Modify the Edge Function to include:
- Student's application count
- Upcoming deadlines
- Recent activity
- Personalized recommendations

### A/B Testing
Create multiple email templates and randomly assign them to test which performs better.

### Segmentation
Send different emails based on:
- Student's progress (new vs active)
- Application status
- Services used
- Location or preferences

## Monitoring

### Check Vercel Logs
```powershell
vercel logs your-project-name --follow
```

Filter for:
- `/api/cron/weekly-promo` - Cron execution
- `weekly promotional emails` - Success messages

### Check Supabase Logs
1. Supabase Dashboard → Edge Functions
2. Select `send-weekly-promo`
3. View **Logs** tab
4. Look for success/error messages

### Email Delivery Metrics
Check Brevo Dashboard for:
- Delivery rate
- Open rate
- Click rate
- Bounce rate

## Troubleshooting

### No emails sent
**Check:**
1. Cron job is enabled in Vercel
2. Edge Function is deployed
3. Supabase secrets are configured
4. Students exist in database with role='student'

### Emails marked as spam
**Solutions:**
1. Add SPF/DKIM records in Brevo
2. Avoid spam trigger words
3. Include unsubscribe link
4. Use consistent sender email

### Rate limiting
**Solutions:**
1. Add delay between emails (already implemented: 100ms)
2. Batch emails in smaller groups
3. Upgrade Brevo plan if needed

## Best Practices

### Content
- ✅ Keep it concise and valuable
- ✅ Include clear CTAs
- ✅ Mobile-responsive design
- ✅ Personalize when possible
- ❌ Don't send too frequently
- ❌ Avoid spam trigger words

### Timing
- ✅ Send during business hours in target timezone
- ✅ Avoid weekends (unless appropriate)
- ✅ Test different times to optimize open rates

### Compliance
- ✅ Include company information
- ✅ Provide unsubscribe option (if required)
- ✅ Follow email marketing laws (CAN-SPAM, GDPR)

## Next Steps

1. **Deploy the Edge Function**
   ```powershell
   supabase functions deploy send-weekly-promo
   ```

2. **Push to Vercel**
   ```powershell
   git add .
   git commit -m "Add weekly promotional emails"
   git push origin main
   ```

3. **Test Immediately**
   - Use `/api/test-weekly-promo` endpoint
   - Verify email received
   - Check email logs

4. **Monitor First Run**
   - Check Vercel logs next Monday at 9 AM UTC
   - Verify emails sent successfully
   - Review open/click rates in Brevo

5. **Optimize**
   - Adjust content based on engagement
   - Test different subject lines
   - Refine CTAs and links

## Summary

✅ **Created**: Supabase Edge Function for promotional emails  
✅ **Configured**: Vercel cron job (every Monday at 9 AM UTC)  
✅ **Added**: Test endpoint for immediate testing  
✅ **Designed**: Professional email template with CTAs  
✅ **Logging**: All emails logged to database  

**Ready to deploy!** 🚀
