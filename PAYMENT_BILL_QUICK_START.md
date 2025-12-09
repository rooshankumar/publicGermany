# Payment Bill Email System - Quick Start Guide

## Overview
Your payment system now has professional bill generation and email alerts, just like the contract system!

## What's New?

### 1. Payment Bill Templates
- Professional HTML bill format (printable A4 size)
- Email-optimized version with status indicators
- Automatic payment history tracking
- Dynamic status colors and icons

### 2. Admin Payments Page Enhancement
- **"Send Bill" button** next to the Save button
- Click to send a professional payment bill to the student
- Admin receives notification when bill is sent
- Non-blocking (UI remains responsive)

## How to Use

### Sending a Payment Bill

1. Go to **Admin Dashboard → Payments**
2. Find the student's payment record
3. Review the payment details:
   - Amount Received
   - Total Amount
   - Amount Pending
   - Status
4. Click the **"Send Bill"** button
5. You'll see a confirmation: "Payment bill sent to [email]"

### What the Student Receives

An email with:
- ✅ Bill status (Pending/Received/Partial/Cancelled)
- 📋 Bill number and date
- 👤 Student information
- 🎓 Service details
- 💰 Payment breakdown:
  - Total Amount
  - Amount Received
  - Amount Pending
- 📜 Payment history (if any previous payments)
- 🔗 Direct link to their account

### What Admin Receives

A notification email showing:
- Student name and email
- Bill number sent
- Service type
- Amount and status
- Request ID and timestamp

## Email Template Features

### Responsive Design
- Works on mobile, tablet, and desktop
- Professional brand colors (blue #1e3a8a)
- Clear section hierarchy

### Status Indicators
- 🟨 Pending (awaiting payment)
- 🟩 Received (fully paid)
- 🟦 Partial (some amount received)
- 🟥 Cancelled

### Dynamic Content
- Automatic totals calculation
- Payment history from database
- Currency support (INR, EUR, USD)
- Timestamp and timestamps

## Payment Status Logic

| Condition | Status |
|-----------|--------|
| Amount Pending = 0 | Received ✅ |
| Amount Received > 0 | Partial 📊 |
| Amount Received = 0 | Pending ⏳ |

## API Reference

If you need to use this programmatically:

```typescript
import { sendPaymentBillEmail } from '@/lib/paymentBillEmail';

await sendPaymentBillEmail({
  serviceId: 'request-id',
  userId: 'user-id',
  studentName: 'John Doe',
  studentEmail: 'john@example.com',
  studentPhone: '+1-123-456-7890',
  serviceType: 'study_abroad',
  serviceName: 'Study Abroad',
  serviceDescription: 'University Application Package',
  serviceAmount: 50000,
  totalAmount: 100000,
  amountReceived: 30000,
  amountPending: 70000,
  paymentStatus: 'partial',
  currency: 'INR',
  includeAdmin: true // Send admin notification too
});
```

## Technical Details

### Files Created
- `/src/lib/paymentBillTemplate.ts` - Bill HTML templates
- `/src/lib/paymentBillEmail.ts` - Email logic
- `/src/pages/admin/Payments.tsx` - Updated with Send Bill button

### Dependencies
- Existing email service (`sendEmail`)
- Supabase for data fetching
- Handlebars syntax support in templates

## Troubleshooting

### "Email not found" error
- Make sure the student's email is properly resolved in the system
- Check that student profile has email address set

### Bill not sending
- Check that payment record exists
- Verify student email is valid
- Check internet connection
- Admin notifications go to `publicgermany@outlook.com`

### Email formatting issues
- If email looks broken, try viewing in different email client
- Clear email cache and refresh
- Check that HTML rendering is enabled in email client

## Best Practices

1. **Always review amounts** before sending bill
2. **Send bills after** updating payment status to "received"
3. **Keep contact info updated** so students receive bills
4. **Monitor admin emails** for delivery confirmations
5. **Use bill numbers** as reference in communications

## Email Customization

To customize email content, edit:
- `/src/lib/paymentBillTemplate.ts` - Modify HTML structure
- `/src/lib/paymentBillEmail.ts` - Modify email text

Common customizations:
- Change company logo/branding
- Adjust colors (currently blue #1e3a8a)
- Modify signature text
- Add payment terms
- Change footer notes

## Example Workflow

1. Student submits service request
2. Admin creates payment record with total amount
3. Student makes partial payment
4. Admin updates payment amount to "received"
5. Admin clicks "Send Bill" to notify student
6. Student receives bill showing:
   - Total: ₹100,000
   - Received: ₹30,000
   - Pending: ₹70,000

## Support

For issues or feature requests:
- Check PAYMENT_BILL_EMAIL_SYSTEM.md for detailed docs
- Review function parameters and types
- Check browser console for any errors
- Verify email service is configured

---

**Happy sending! 📧💰**
