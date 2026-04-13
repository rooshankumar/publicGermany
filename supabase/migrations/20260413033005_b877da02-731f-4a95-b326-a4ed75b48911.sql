
-- Add 'editor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';

-- Create editor_permissions table
CREATE TABLE public.editor_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  editor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_view_profile boolean NOT NULL DEFAULT true,
  can_view_documents boolean NOT NULL DEFAULT true,
  can_view_applications boolean NOT NULL DEFAULT true,
  can_view_payments boolean NOT NULL DEFAULT false,
  can_view_contracts boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(editor_user_id, student_user_id)
);

-- Enable RLS
ALTER TABLE public.editor_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all editor permissions
CREATE POLICY "Admins can manage editor permissions"
ON public.editor_permissions FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Editors can view their own permission rows
CREATE POLICY "Editors can view own permissions"
ON public.editor_permissions FOR SELECT TO authenticated
USING (editor_user_id = auth.uid());

-- Security definer function: check if current user is an editor for a given student
CREATE OR REPLACE FUNCTION public.is_editor_for_student(p_editor_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.editor_permissions
    WHERE editor_user_id = p_editor_id
      AND student_user_id = p_student_id
  )
$$;

-- Security definer: check specific permission for editor+student
CREATE OR REPLACE FUNCTION public.editor_has_permission(p_editor_id uuid, p_student_id uuid, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.editor_permissions ep
    WHERE ep.editor_user_id = p_editor_id
      AND ep.student_user_id = p_student_id
      AND (
        (p_permission = 'profile' AND ep.can_view_profile = true) OR
        (p_permission = 'documents' AND ep.can_view_documents = true) OR
        (p_permission = 'applications' AND ep.can_view_applications = true) OR
        (p_permission = 'payments' AND ep.can_view_payments = true) OR
        (p_permission = 'contracts' AND ep.can_view_contracts = true)
      )
  );
END;
$$;

-- Allow editors to SELECT profiles of their assigned students
CREATE POLICY "Editors can view assigned student profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.editor_has_permission(auth.uid(), user_id, 'profile')
);

-- Allow editors to SELECT documents of their assigned students
CREATE POLICY "Editors can view assigned student documents"
ON public.documents FOR SELECT TO authenticated
USING (
  public.editor_has_permission(auth.uid(), user_id, 'documents')
);

-- Allow editors to SELECT applications of their assigned students
CREATE POLICY "Editors can view assigned student applications"
ON public.applications FOR SELECT TO authenticated
USING (
  public.editor_has_permission(auth.uid(), user_id, 'applications')
);

-- Allow editors to SELECT service_requests of their assigned students (for payments view)
CREATE POLICY "Editors can view assigned student service requests"
ON public.service_requests FOR SELECT TO authenticated
USING (
  public.editor_has_permission(auth.uid(), user_id, 'payments')
);

-- Allow editors to SELECT service_payments of their assigned students
CREATE POLICY "Editors can view assigned student payments"
ON public.service_payments FOR SELECT TO authenticated
USING (
  public.editor_has_permission(auth.uid(), user_id, 'payments')
);

-- Allow editors to SELECT contracts of their assigned students
CREATE POLICY "Editors can view assigned student contracts"
ON public.contracts FOR SELECT TO authenticated
USING (
  public.editor_has_permission(auth.uid(), student_id, 'contracts')
);
