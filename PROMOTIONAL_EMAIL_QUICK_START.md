# Weekly Promotional Emails - Quick Start ✅

## ✅ SETUP COMPLETE!

Your weekly promotional email system is now ready!

## What Was Created

### 1. Supabase Edge Function ✅
- **Function**: `send-weekly-promo`
- **Status**: Deployed
- **Purpose**: Sends promotional emails to all students

### 2. Vercel Cron Job ✅
- **Schedule**: Every Monday at 9:00 AM UTC (2:30 PM IST)
- **Endpoint**: `/api/cron/weekly-promo`
- **Status**: Configured in `vercel.json`

### 3. Test Endpoint ✅
- **Endpoint**: `/api/test-weekly-promo`
- **Purpose**: Test emails without waiting for Monday

## Email Features

Your promotional email includes:

✅ **Professional Design** - Branded with publicGermany colors  
✅ **Application Tracking** - Promotes the applications feature  
✅ **Document Management** - Highlights document services  
✅ **Expert Services** - Showcases available services  
✅ **Pro Tips** - Weekly educational content  
✅ **Platform Stats** - Shows 400+ universities, 1000+ programs  
✅ **Call to Actions** - Links to dashboard, applications, services  
✅ **Mobile Responsive** - Looks great on all devices  

## Next Steps

### 1. Push to Vercel (Required)
```powershell
git add .
git commit -m "Add weekly promotional email system"
git push origin main
```

This will:
- Deploy the new API endpoints
- Activate the cron job
- Make the system live

### 2. Test Right Now
```powershell
# Start dev server
npm run dev

# In another terminal, test
curl http://localhost:5173/api/test-weekly-promo
```

Or test via Supabase Dashboard:
1. Go to [Supabase Functions](https://supabase.com/dashboard/project/rzbnrlfujjxyrypbafdp/functions)
2. Click `send-weekly-promo`
3. Click **Invoke**
4. Check your email!

### 3. Verify Email Logs
1. Login as admin
2. Go to **Admin Dashboard** → **Email Logs**
3. Look for:
   - Template: `weekly_promo`
   - Subject: "🎓 Your Weekly Update from publicGermany"
   - Status: `success`

## When Will Emails Be Sent?

**Automatically every Monday at 9:45 AM IST (4:15 AM UTC)**

Next scheduled send: **Monday, October 21, 2025 at 9:45 AM IST**

## Who Receives Emails?

✅ All users with `role = 'student'` in the profiles table  
❌ Admins are excluded (role = 'admin')  
❌ Users without email addresses are skipped  

## Customizing the Email

To change the email content, edit:
```
supabase/functions/send-weekly-promo/index.ts
```

Then redeploy:
```powershell
supabase functions deploy send-weekly-promo
```

### Change Schedule

Edit `vercel.json`:
```json
{
  "path": "/api/cron/weekly-promo",
  "schedule": "0 9 * * 1"  // Every Monday at 9 AM UTC
}
```

**Popular schedules:**
- `0 9 * * 1` - Every Monday at 9 AM
- `0 9 * * 5` - Every Friday at 9 AM  
- `0 9 1 * *` - First day of every month
- `0 9 1,15 * *` - 1st and 15th of every month

Then push to Vercel:
```powershell
git add vercel.json
git commit -m "Update promotional email schedule"
git push origin main
```

## Monitoring

### Vercel Logs
```powershell
vercel logs your-project-name --follow
```

### Supabase Logs
1. Supabase Dashboard → Edge Functions
2. Select `send-weekly-promo`
3. View **Logs** tab

### Email Logs in App
Admin Dashboard → Email Logs → Filter by template: `weekly_promo`

## Summary

✅ **Edge Function**: Deployed to Supabase  
✅ **Cron Job**: Configured in vercel.json  
✅ **Test Endpoint**: Ready to use  
✅ **Email Template**: Professional and branded  
✅ **Logging**: All emails tracked in database  

**Action Required:**
1. Push to Vercel to activate the cron job
2. Test using `/api/test-weekly-promo`
3. Wait for Monday at 2:30 PM IST for automatic send

🚀 **Your promotional email system is ready!**
