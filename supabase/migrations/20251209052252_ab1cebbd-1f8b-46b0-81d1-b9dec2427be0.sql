-- Fix RLS policies on notifications table to allow cross-user notifications
-- This is needed for: student uploading signed contract -> notify admin, admin sending bill -> notify student

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "notif_insert_self" ON public.notifications;

-- Create a new policy that allows authenticated users to insert notifications for themselves OR for admins (for signed contract notifications)
CREATE POLICY "notif_insert_authenticated"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can insert notifications for themselves
  auth.uid() = user_id
  OR
  -- Users can insert notifications for admins (when uploading signed contracts)
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = notifications.user_id 
    AND p.role = 'admin'
  )
  OR
  -- Admins can insert notifications for any user (for payment updates, contracts, etc.)
  public.is_admin(auth.uid())
);

-- Update the select policy to allow admins to see all notifications
DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
CREATE POLICY "notif_select_own_or_admin"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  public.is_admin(auth.uid())
);

-- Update the update policy to allow admins to update any notification
DROP POLICY IF EXISTS "notif_update_seen" ON public.notifications;
CREATE POLICY "notif_update_own_or_admin"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR
  public.is_admin(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  OR
  public.is_admin(auth.uid())
);