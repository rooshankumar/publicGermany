# Payment Bill Email System

This system generates and sends professional payment bills to students via email, similar to your contract generator.

## Features

✅ **Professional HTML Templates**
- Responsive email-friendly design
- Print-ready bill format
- Watermarked branding with publicgermany logo

✅ **Smart Payment Status Tracking**
- Pending (awaiting payment)
- Partial (some amount received)
- Received (fully paid)
- Cancelled

✅ **Automated Email Alerts**
- Student receives detailed payment bill
- Admin notified of bill sent
- Includes payment history and totals

✅ **Easy Integration**
- One-click "Send Bill" button in admin Payments page
- Automatic calculation of totals and remaining balance
- Non-blocking email delivery

## Files Created

### 1. `/src/lib/paymentBillTemplate.ts`
Contains the HTML template generators for payment bills.

**Key Functions:**
- `generatePaymentBillHTML()` - Full printable bill (A4 format)
- `generatePaymentBillEmailHTML()` - Email-optimized bill
- `PaymentBillData` interface - Type-safe bill data

**Features:**
- Customizable payment status colors
- Currency formatting (INR, EUR, USD)
- Payment history table
- Signature blocks
- Footer notes and watermark

### 2. `/src/lib/paymentBillEmail.ts`
Handles payment bill email generation and sending.

**Key Functions:**
- `sendPaymentBillEmail()` - Generate and send bill to student + admin
- `generatePaymentBillPDF()` - Generate printable bill HTML

**Parameters:**
```typescript
interface PaymentEmailData {
  serviceId: string;           // Service request ID
  userId: string;              // Student user ID
  studentName: string;         // Full name
  studentEmail: string;        // Email address
  studentPhone: string;        // Phone number
  serviceType: string;         // Type of service (e.g., 'study_abroad')
  serviceName?: string;        // Display name
  serviceDescription?: string; // Service details
  serviceAmount: number;       // Amount for this service
  totalAmount: number;         // Total bill amount
  amountReceived: number;      // Amount already received
  amountPending: number;       // Amount still pending
  paymentStatus: 'pending' | 'received' | 'cancelled' | 'partial';
  paymentMethod?: string;      // Method of payment
  contractReference?: string;  // Reference/contract number
  currency?: string;           // Currency code (default: INR)
  includeAdmin?: boolean;      // Send admin notification (default: true)
}
```

### 3. Updated `/src/pages/admin/Payments.tsx`
Added "Send Bill" button to payment management interface.

**New Features:**
- Import of `sendPaymentBillEmail` function
- `sendPaymentBillId` state to track sending status
- `sendPaymentBill()` function to trigger email
- "Send Bill" button next to "Save" button in Actions column
- Loading state while sending

## Usage

### In Admin Payments Page

1. Navigate to Admin → Payments
2. Locate the payment record
3. Review/update payment details (optional)
4. Click "Send Bill" button
5. Confirmation toast will appear
6. Student receives the payment bill email

### Programmatic Usage

```typescript
import { sendPaymentBillEmail } from '@/lib/paymentBillEmail';

// Send payment bill
await sendPaymentBillEmail({
  serviceId: 'req_123',
  userId: 'user_456',
  studentName: 'John Doe',
  studentEmail: 'john@example.com',
  studentPhone: '+1 234 567 8900',
  serviceType: 'study_abroad',
  serviceName: 'Study Abroad Preparation',
  serviceDescription: 'Complete package for university application',
  serviceAmount: 50000,
  totalAmount: 100000,
  amountReceived: 30000,
  amountPending: 70000,
  paymentStatus: 'partial',
  currency: 'INR'
});
```

## Email Content

The email includes:

### Student Email
- Bill status indicator (⏳ Pending, ✅ Received, 📊 Partial, ❌ Cancelled)
- Bill number and date
- Student information (Name, Email, Phone)
- Service details (Name, Description, Amount)
- Payment history (if any)
- Totals:
  - Total Amount
  - Amount Received
  - Amount Pending
- Call-to-action button to view account
- Company branding

### Admin Email
- Notification that bill was sent
- Student details
- Bill number and amount
- Request ID and timestamp
- Service information

## Email Template Style

The email template features:
- Professional blue (#1e3a8a) color scheme
- Responsive design
- Clear hierarchical information
- Status-specific styling
- Clean typography
- Mobile-friendly layout

## Status Colors

| Status | Color | Icon |
|--------|-------|------|
| Pending | Yellow/Orange | ⏳ |
| Partial | Pink | 📊 |
| Received | Green | ✅ |
| Cancelled | Red | ❌ |

## Integration Points

The payment bill system integrates with:
- **Supabase**: Fetches payment history and student data
- **Email Service**: Uses existing `sendEmail` function
- **UI Components**: Toast notifications for feedback

## Error Handling

- Email resolution failure shows user-friendly toast
- Sending errors are caught and displayed
- Non-blocking: UI remains responsive during email send

## Future Enhancements

Potential improvements:
- PDF attachment generation for bills
- Scheduled bill reminders (e.g., weekly unpaid bills)
- Bill templates for different service types
- Multi-language support
- SMS backup notifications
- Bill download functionality for students
