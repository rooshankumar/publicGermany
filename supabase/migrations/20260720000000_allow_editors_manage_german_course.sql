-- Allow editors to manage german_course_videos (add/edit/delete lectures)
-- Editors need CRUD access like admins, but the Students/Access tab stays admin-only (handled in app code)

DROP POLICY IF EXISTS "Admins can manage course videos" ON public.german_course_videos;

CREATE POLICY "Admins and editors can manage course videos"
  ON public.german_course_videos FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'editor'
  ))
  WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'editor'
  ));
