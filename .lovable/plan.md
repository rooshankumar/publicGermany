

## Plan: Editor Role System + Performance Optimization

### Overview
Add a new "editor" role with granular, per-student permissions controlled by you (the main admin). Also fix the existing build errors and improve app performance.

### Part A: Fix Existing Build Errors (prerequisite)

1. **`src/lib/cvImporter.ts` line 70** — `String.indexOf` called with 3 args (the 3rd `searchEnd` is invalid). Fix by using `.slice()` before `.indexOf()`.

2. **`src/pages/admin/Requests.tsx`** — `Label` component not imported; `deliverable_files` should be `deliverable_urls`. Add the missing `Label` import and fix the property name.

3. **`src/components/admin/BulkEmailPanel.tsx` line 68** — Type predicate mismatch. Add `created_at` to the `UserProfile` interface.

### Part B: Database Changes (migrations)

1. **Add `'editor'` to the `app_role` enum**:
   ```sql
   ALTER TYPE public.app_role ADD VALUE 'editor';
   ```

2. **Create `editor_permissions` table** — controls which students an editor can see and what sections are visible:
   ```sql
   CREATE TABLE public.editor_permissions (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     editor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     can_view_profile boolean DEFAULT true,
     can_view_documents boolean DEFAULT true,
     can_view_applications boolean DEFAULT true,
     can_view_payments boolean DEFAULT false,  -- off by default
     can_view_contracts boolean DEFAULT false,
     created_at timestamptz DEFAULT now(),
     UNIQUE(editor_user_id, student_user_id)
   );
   ALTER TABLE public.editor_permissions ENABLE ROW LEVEL SECURITY;
   ```

3. **RLS policies for `editor_permissions`**:
   - Admins can manage all rows
   - Editors can SELECT their own rows

4. **Update RLS on `profiles`, `documents`, `applications`** to allow editors to read students they have permission for (using a `SECURITY DEFINER` helper function).

### Part C: Editor Dashboard & UI

1. **New page: `src/pages/editor/EditorDashboard.tsx`** — A simplified admin dashboard showing only assigned students with their allowed details. No financial stats, no payment sections, no bulk email.

2. **New page: `src/pages/editor/EditorStudentProfile.tsx`** — Shows student profile/docs/applications based on permissions. Hides payments/contracts tabs if `can_view_payments`/`can_view_contracts` is false.

3. **Admin "Manage Editors" page: `src/pages/admin/Editors.tsx`**:
   - List all users with role `editor`
   - Invite/create editor accounts
   - Assign students to editors with toggle controls per permission (profile, docs, applications, payments, contracts)

4. **Update `ProtectedRoute.tsx`** to handle `'editor'` role — editors get redirected to `/editor` dashboard, not `/dashboard` or `/admin`.

5. **Update `MobileNavigation.tsx`** and `Layout.tsx`** to show editor-specific nav items.

6. **Update `useAuth.ts` Profile type** to include `'editor'` in the role union.

7. **New routes in `App.tsx`**:
   - `/editor` → EditorDashboard
   - `/editor/students/:studentId` → EditorStudentProfile
   - `/admin/editors` → Manage Editors page

### Part D: Performance Improvements

1. **React Query optimizations** — Reduce `staleTime` for admin pages, add `keepPreviousData` to list queries to prevent UI flicker on re-fetch.

2. **Memoize heavy components** — Wrap list items (student cards, request rows) with `React.memo`.

3. **Virtualize long lists** — Add `@tanstack/react-virtual` for the Students list page to avoid rendering hundreds of DOM nodes.

4. **Debounce search inputs** — Already partially done; ensure all admin search/filter inputs use debounced values.

5. **Lazy-load editor routes** — Add to the existing lazy-import pattern.

6. **Optimize `useAuth` profile fetch** — Skip re-fetching profile if cached version matches `user_id` and is < 5 minutes old.

### Technical Details

**Role hierarchy**: `admin` > `editor` > `student`. The `is_admin()` function remains unchanged (only matches `admin`). A new `is_editor_for_student(editor_uid, student_uid)` SECURITY DEFINER function will check `editor_permissions`.

**RLS example for documents**:
```sql
CREATE POLICY "Editors can view permitted student documents"
ON public.documents FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.editor_permissions ep
    WHERE ep.editor_user_id = auth.uid()
      AND ep.student_user_id = documents.user_id
      AND ep.can_view_documents = true
  )
);
```

**Files to create**: ~4 new pages, 1 new hook (`useEditorPermissions`).
**Files to edit**: ~8 existing files (App.tsx, ProtectedRoute, useAuth, MobileNavigation, Layout, BulkEmailPanel, cvImporter, Requests).
**Migration**: 1 migration with enum update + new table + RLS + helper function.

