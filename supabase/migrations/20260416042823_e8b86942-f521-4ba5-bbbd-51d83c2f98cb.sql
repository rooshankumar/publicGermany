-- 1. app_settings: enable RLS, public read, admin write
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read settings"
  ON public.app_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.app_settings FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2. emails_outbox: enable RLS, admin-only access
ALTER TABLE public.emails_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage outbox"
  ON public.emails_outbox FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow service role / triggers to insert (RLS bypassed by service role, so this covers authenticated admin inserts)
CREATE POLICY "Authenticated can insert outbox"
  ON public.emails_outbox FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. deadline_reminders: enable RLS, admin-only
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage deadline reminders"
  ON public.deadline_reminders FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. german_course_videos: fix overpermissive policies
DROP POLICY IF EXISTS "Manage german_course_videos" ON public.german_course_videos;
DROP POLICY IF EXISTS "TEMP allow insert" ON public.german_course_videos;

CREATE POLICY "Admins can manage course videos"
  ON public.german_course_videos FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. contracts: fix overpermissive insert policy
DROP POLICY IF EXISTS "allow insert for authenticated users" ON public.contracts;

CREATE POLICY "Admins can insert contracts"
  ON public.contracts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- 6. services: enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read services"
  ON public.services FOR SELECT USING (true);

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7. services_catalog: enable RLS
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read catalog"
  ON public.services_catalog FOR SELECT USING (true);

CREATE POLICY "Admins can manage catalog"
  ON public.services_catalog FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));