
# Editor Referral CRM

Turn the existing Editors module into a full referral CRM. Referrals live separate from official Students until an admin converts them. Both admin and editor sides get new workspaces.

## 1. Database (single migration)

New tables (all in `public`, RLS on, service_role ALL, standard grants):

- **referrals** — owner_editor_id, full_name, phone, whatsapp, email, city, state, qualification, percentage, passing_year, passport_available (bool), german_level, preferred_intake, lead_source, current_status (enum-like text), priority (low/medium/high), next_followup_date, remarks, commission_status (pending/paid), converted_student_id (nullable FK profiles.user_id), converted_at, created_at, updated_at.
- **referral_services** — referral_id, service_key (german_course, admission, visa, blocked_account, accommodation, aps, insurance, sop, other). Unique(referral_id, service_key).
- **referral_activities** — referral_id, actor_user_id, type (created, note, call, whatsapp, message, demo, docs, status_change, converted, task, other), title, body, meta jsonb, created_at. Append-only.
- **referral_tasks** — referral_id, owner_editor_id, title, due_date, status (open/done/cancelled), created_at, updated_at.
- **referral_documents** — referral_id, uploaded_by, category (passport/academic/cv/language/other), file_name, file_url, mime, size, created_at.

Storage: reuse `documents` bucket under path `referrals/{referral_id}/...`.

RLS:
- Editors: full CRUD on their own referrals + children.
- Admins (`is_admin`): full read/write on everything.
- Students/anon: no access.

Triggers:
- `updated_at` on referrals and tasks.
- On referral insert → activity `created`.
- On `current_status` change → activity `status_change` (meta: from/to).

Indexes: referrals(owner_editor_id, current_status, next_followup_date, priority); activities(referral_id, created_at desc); tasks(owner_editor_id, status, due_date).

## 2. Admin — Editors module

`src/pages/admin/Editors.tsx` becomes a workspace list. Each editor card shows: avatar, name, email, status, and 3 counters (Assigned Students, Manual Referrals, Qualified Leads).

New `src/pages/admin/EditorProfile.tsx` with tabs:
- **Overview** — profile info + stats (Assigned / Referrals / Qualified / Converted).
- **Assigned Students** — reuse existing editor_permissions join; clicking a row → `/admin/students/:id`.
- **Manual Referrals** — table with actions: View, Edit, Convert to Student, Reject, Merge.
- **Qualified Leads** — same table filtered to statuses (`interested`, `documents_pending`, `documents_received`, `application_started`).
- **Activity** — global timeline for this editor's referrals, newest first.

Convert flow: creates auth-less profile row placeholder or links to an existing one, sets `referrals.converted_student_id`, adds activity `converted`.

## 3. Editor dashboard

Replace `src/pages/editor/EditorDashboard.tsx` with a shell using tabs / bottom nav:
Dashboard · My Referrals · Assigned Students · Tasks · Profile.

**Dashboard cards**: Assigned Students, My Referrals, Today's Follow-ups, Overdue Follow-ups, Qualified Leads, Converted, Pending Tasks. Compact grid, pg-tokens, no gradients.

**My Referrals** (`/editor/referrals`) — search, filters (status, priority, service), Add Referral button. Table columns: Name, Interested Services (chips), Status, Priority, Next Follow-up, Last Activity.

**Add Referral form** — sectioned inline form:
1. Personal (name, phone, whatsapp, email, city, state)
2. Education (qualification, %/CGPA, passing year, passport, german level, intake)
3. Interested Services (multi-select chips)
4. Lead (source dropdown)
5. Follow-up (status, priority, next date, remarks)
6. Documents (multi-upload via existing `MultiFileUpload`)

**Referral Details** (`/editor/referrals/:id`) — tabs: Overview, Timeline, Tasks, Notes, Documents. Timeline is append-only; each status change / note / call logs a new activity. Task list with quick-add and overdue badge.

**Assigned Students** — keep existing list, but simplified into the tab.

**Tasks** — cross-referral task inbox grouped by Today / Overdue / Upcoming.

## 4. Shared

- Constants file `src/lib/referralConstants.ts` (services, statuses, sources, priorities, colors).
- Hook `src/hooks/useReferrals.ts` (list + single + mutations) using React Query.
- Hook `src/hooks/useReferralTasks.ts`, `useReferralActivities.ts`.
- Reuse existing primitives (Card, Badge, Tabs, Table). No new dependencies.

## Out of scope

- No commission math, no payments, no notifications beyond existing notifications table (skip for v1).
- Merge action wired as UI stub calling admin RPC placeholder (returns "coming soon" toast) unless trivial.
- Referral → Student conversion creates a lightweight linkage only; auth user creation stays manual.

## Delivery order

1. Migration (tables, RLS, triggers, indexes, grants).
2. Constants + hooks.
3. Editor dashboard shell + Referrals list + Add form + Details tabs + Tasks.
4. Admin Editors list refresh + EditorProfile tabs + convert/reject actions.
5. QA pass: types regen, build check, spot-check RLS via linter.
