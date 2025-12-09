# Payment Bill Email System - Visual Guide

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   ADMIN PAYMENTS PAGE                           │
│  /src/pages/admin/Payments.tsx                                  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────────────────────┐   │
│  │ Payment Records  │  │ Actions                          │   │
│  ├──────────────────┤  ├──────────────────────────────────┤   │
│  │ Student Name     │  │ [Save]  [Send Bill] ← NEW       │   │
│  │ Service Type     │  │  Click to send payment bill      │   │
│  │ Amount Received  │  └──────────────────────────────────┘   │
│  │ Total Amount     │                                         │
│  │ Status           │                                         │
│  └──────────────────┘                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         │ sendPaymentBill(row, payment)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│         PAYMENT BILL EMAIL SERVICE                              │
│  /src/lib/paymentBillEmail.ts                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ sendPaymentBillEmail(data)                              │   │
│  │                                                         │   │
│  │ 1. Calculate totals & payment status                    │   │
│  │ 2. Fetch payment history from Supabase                  │   │
│  │ 3. Generate email HTML from template                    │   │
│  │ 4. Send to student email                                │   │
│  │ 5. Send admin notification                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────┬──────────────┐
         │                                         │              │
         ▼                                         ▼              ▼
┌───────────────────────┐  ┌────────────────────┐ ┌──────────────────┐
│ BILL TEMPLATE         │  │ SUPABASE DATABASE  │ │ EMAIL SERVICE    │
│ /src/lib/             │  │                    │ │ (sendEmail)      │
│ paymentBillTemplate.ts│  │ ┌────────────────┐ │ │                  │
│                       │  │ │service_payments│ │ │ Sends via:       │
│ generatePaymentBill   │  │ └────────────────┘ │ │ Supabase Edge    │
│ EmailHTML()           │  │ ┌────────────────┐ │ │ Function         │
│                       │  │ │service_requests│ │ │                  │
│ Returns: HTML string  │  │ └────────────────┘ │ │ Configured for:  │
│ with all bill details │  │ ┌────────────────┐ │ │ student email +  │
│ personalized for      │  │ │profiles        │ │ │ admin email      │
│ student              │  │ └────────────────┘ │ │                  │
│                       │  │                    │ │                  │
│ Features:             │  └────────────────────┘ └──────────────────┘
│ • Logo & branding     │
│ • Bill number         │
│ • Status indicator    │
│ • Payment details     │
│ • Payment history     │
│ • Totals breakdown    │
│ • Company info        │
└───────────────────────┘
```

## 📧 Email Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STUDENT RECEIVES EMAIL                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  publicgermany                                             │    │
│  │  Payment Bill / Receipt                                    │    │
│  │  For Study Abroad Services                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  STATUS: 📊 PARTIAL                                        │    │
│  │  Bill #: BILL-2025-ABC12345                                │    │
│  │  Date: December 9, 2025                                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  BILLED TO                       ISSUED BY                         │
│  John Doe                        publicgermany                     │
│  john@example.com                publicgermany@outlook.com         │
│  +1 234 567 8900                 publicgermany.vercel.app          │
│                                                                     │
│  SERVICE & PAYMENT DETAILS                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Service: Study Abroad                                      │    │
│  │ Description: University Application Package                │    │
│  │ Amount: ₹ 100,000                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  PAYMENT HISTORY                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Payment 1: ₹ 30,000 on Dec 1, 2025 (Received)              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  TOTALS                                                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Total Amount        ₹ 100,000                              │    │
│  │ Amount Received     ₹ 30,000                               │    │
│  │ Amount Pending      ₹ 70,000                               │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │ Balance Payable     ₹ 70,000                               │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  [View Your Account]                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

AND

┌─────────────────────────────────────────────────────────────────────┐
│                   ADMIN RECEIVES NOTIFICATION                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Payment Bill Email Sent                                            │
│  ─────────────────────────────────────────────────────────────     │
│                                                                     │
│  A payment bill email was sent to the student with the              │
│  following details:                                                 │
│                                                                     │
│  Student: John Doe                                                  │
│  Email: john@example.com                                            │
│  Service: Study Abroad                                              │
│  Bill Number: BILL-2025-ABC12345                                    │
│  Total Amount: INR 100,000                                          │
│  Amount Received: INR 30,000                                        │
│  Status: PARTIAL                                                    │
│                                                                     │
│  Request ID: abc12345-def67890-ghi12345-jkl67890                    │
│  Date/Time: Dec 9, 2025 3:45 PM                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

```
ADMIN ACTION
    │
    │ User clicks "Send Bill" button
    │
    ▼
┌──────────────────────────────────┐
│ sendPaymentBill(row, payment)    │
│                                  │
│ Validates student email          │
│ Calculates totals:               │
│  • Amount Received               │
│  • Amount Pending                │
│  • Remaining Balance             │
│ Determines status:               │
│  • Pending (0 received)          │
│  • Partial (some received)       │
│  • Received (all paid)           │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────┐
│ sendPaymentBillEmail(PaymentEmailData)                   │
│                                                          │
│ 1. Fetch payment history from DB                         │
│    SELECT * FROM service_payments                        │
│    WHERE service_id = ? AND status = 'received'          │
│                                                          │
│ 2. Generate bill number                                  │
│    BILL-[YEAR]-[ID_PREFIX]                               │
│    → BILL-2025-ABC12345                                  │
│                                                          │
│ 3. Create PaymentBillData object                         │
│    {                                                     │
│      studentName,                                        │
│      studentEmail,                                       │
│      billNumber,                                         │
│      totalAmount,                                        │
│      amountReceived,                                     │
│      payments: [...],                                    │
│      ... 15 more fields                                  │
│    }                                                     │
│                                                          │
│ 4. Generate HTML from template                           │
│    generatePaymentBillEmailHTML(billData)                │
│                                                          │
│ 5. Send student email                                    │
│    sendEmail(studentEmail, subject, html)                │
│                                                          │
│ 6. Send admin email                                      │
│    sendEmail(admin@outlook.com, subject, html)           │
│                                                          │
│ 7. Return success response                               │
└──────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│ Toast Notification               │
│ "Payment bill sent successfully" │
│ "Bill sent to john@example.com"  │
└──────────────────────────────────┘
    │
    ▼
STUDENT RECEIVES EMAIL ✓
ADMIN RECEIVES NOTIFICATION ✓
```

## 💾 Database Schema References

```
service_requests (Parent)
├── id: uuid
├── user_id: uuid
├── service_type: text
├── service_price: decimal
├── service_currency: text
├── target_total_amount: decimal (editable)
├── target_currency: text (editable)
└── created_at: timestamp

service_payments (Children)
├── id: uuid
├── service_id: uuid (FK → service_requests.id)
├── user_id: uuid
├── amount: decimal
├── currency: text
├── status: enum['pending', 'received', 'cancelled']
├── admin_note: text
├── proof_url: text
└── created_at: timestamp

profiles
├── user_id: uuid (PK)
├── full_name: text
├── email: text
├── phone: text
└── ...
```

## 🎨 Status Color Scheme

| Status | Color | Icon | Usage |
|--------|-------|------|-------|
| Pending | 🟨 Orange (#fef3c7) | ⏳ | Waiting for payment |
| Partial | 🟦 Pink (#fce7f3) | 📊 | Some amount received |
| Received | 🟩 Green (#d1fae5) | ✅ | Fully paid |
| Cancelled | 🟥 Red (#fee2e2) | ❌ | Payment cancelled |

## 📱 Responsive Breakpoints

```
Desktop (> 1024px)          Tablet (768px - 1024px)    Mobile (< 768px)
├─ Side by side layout      ├─ Stacked layout          ├─ Full width
├─ 3-column grid            ├─ 2-column grid           ├─ Single column
├─ Full table view          ├─ Horizontal scroll       ├─ Card view
└─ All details visible      └─ Key info visible        └─ Essential only
```

## 🔐 Security & Permissions

```
┌─────────────────────────────────────┐
│ ROLE-BASED ACCESS CONTROL           │
├─────────────────────────────────────┤
│                                     │
│ Student Role:                       │
│ • View own payment bill ✓           │
│ • Cannot send bill ✗                │
│ • Cannot access admin page ✗        │
│                                     │
│ Admin Role:                         │
│ • View all payments ✓               │
│ • Send payment bills ✓              │
│ • Edit payment records ✓            │
│ • View admin notifications ✓        │
│                                     │
│ Public:                             │
│ • No access ✗                       │
│                                     │
└─────────────────────────────────────┘
```

## ⚙️ Configuration

### Email Service Configuration
```typescript
// Uses existing sendEmail from /src/lib/sendEmail.ts
// Which invokes: supabase.functions.invoke("send-email")
// Configured in: Supabase Edge Functions

To: student email (from profiles)
CC: (optional)
BCC: (optional)
Subject: "Payment Bill - [BILL-NUMBER] ([STATUS])"
HTML: Generated from template
```

### Payment Status Rules
```
IF amount_pending <= 0 THEN
  status = 'received'
ELSE IF amount_received > 0 THEN
  status = 'partial'
ELSE
  status = 'pending'
END IF
```

### Bill Number Generation
```
Format: BILL-[YEAR]-[SERVICE-ID-PREFIX]
Example: BILL-2025-ABC12345

Service ID: abc12345-xyz789...
Prefix: First 8 chars converted to uppercase
```

## 📊 Data Calculations

```
┌─────────────────────────────────────┐
│ TOTALS CALCULATION                  │
├─────────────────────────────────────┤
│                                     │
│ receivedSum = SUM(                  │
│   service_payments.amount           │
│   WHERE status = 'received'         │
│ )                                   │
│                                     │
│ targetTotal = COALESCE(             │
│   target_total_amount,              │
│   service_price                     │
│ )                                   │
│                                     │
│ remaining = MAX(                    │
│   0,                                │
│   targetTotal - receivedSum         │
│ )                                   │
│                                     │
│ paymentStatus =                     │
│   CASE                              │
│   WHEN remaining <= 0               │
│     THEN 'received'                 │
│   WHEN receivedSum > 0              │
│     THEN 'partial'                  │
│   ELSE 'pending'                    │
│   END                               │
│                                     │
└─────────────────────────────────────┘
```

## 🚀 Deployment Checklist

- [x] TypeScript compilation passes
- [x] No lint errors
- [x] Email service configured
- [x] Database schema compatible
- [x] Template styling responsive
- [x] Error handling implemented
- [x] UI/UX tested
- [x] Documentation complete
- [x] Ready for production

---

## 📞 Quick Reference

**File Locations:**
- Templates: `/src/lib/paymentBillTemplate.ts`
- Email logic: `/src/lib/paymentBillEmail.ts`
- UI component: `/src/pages/admin/Payments.tsx`

**Key Functions:**
- `sendPaymentBillEmail()` - Send bill
- `generatePaymentBillHTML()` - Full bill
- `generatePaymentBillEmailHTML()` - Email version

**Entry Point:**
- Admin Payments page → Select row → Click "Send Bill"

---

*Visual guide created: December 9, 2025*
