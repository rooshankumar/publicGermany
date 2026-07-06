
CREATE TABLE public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price integer NOT NULL,
  advance_amount integer,
  badge text,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_packages TO authenticated;
GRANT ALL ON public.service_packages TO service_role;

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active packages" ON public.service_packages
  FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage packages" ON public.service_packages
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_service_packages_active_order ON public.service_packages (is_active, display_order);
CREATE TRIGGER trg_service_packages_updated_at BEFORE UPDATE ON public.service_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.package_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.service_packages(id) ON DELETE CASCADE,
  feature text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.package_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.package_features TO authenticated;
GRANT ALL ON public.package_features TO service_role;

ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read package features" ON public.package_features FOR SELECT USING (true);
CREATE POLICY "Admins manage package features" ON public.package_features
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_package_features_pkg_order ON public.package_features (package_id, display_order);

ALTER TABLE public.services_catalog
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_services_catalog_active_order
  ON public.services_catalog (is_active, display_order);

-- Seed packages + features
WITH pkg AS (
  INSERT INTO public.service_packages
    (title, slug, description, price, advance_amount, badge, icon, display_order)
  VALUES
    ('Pay After Admission', 'pay-after-admission',
     'Full admission support with minimal upfront commitment — pay the remainder only after you receive an admission offer.',
     60000, 2000, 'Most Popular', 'GraduationCap', 1),
    ('Pay After Visa', 'pay-after-visa',
     'End-to-end visa support with minimal upfront commitment — pay the remainder only after your visa is approved.',
     25000, 2000, 'Risk-Free', 'ShieldCheck', 2),
    ('Standard Admission', 'standard-admission',
     'Complete admission package — profile evaluation to university applications. Paid before the application process begins.',
     35000, NULL, NULL, 'BookOpen', 3),
    ('Standard Visa Application', 'standard-visa',
     'Complete visa application support. Paid before the visa process begins.',
     20000, NULL, NULL, 'Plane', 4)
  RETURNING id, slug
)
INSERT INTO public.package_features (package_id, feature, display_order)
SELECT p.id, f.feature, f.ord FROM pkg p
JOIN (VALUES
  ('pay-after-admission', 'Profile evaluation', 1),
  ('pay-after-admission', 'University shortlisting', 2),
  ('pay-after-admission', 'SOP', 3),
  ('pay-after-admission', 'LOR', 4),
  ('pay-after-admission', 'Europass CV', 5),
  ('pay-after-admission', 'University applications', 6),
  ('pay-after-admission', 'Complete admission support', 7),
  ('pay-after-visa', 'Visa SOP', 1),
  ('pay-after-visa', 'Document verification', 2),
  ('pay-after-visa', 'VFS appointment', 3),
  ('pay-after-visa', 'Visa guidance', 4),
  ('standard-admission', 'Profile evaluation', 1),
  ('standard-admission', 'University shortlisting', 2),
  ('standard-admission', 'SOP', 3),
  ('standard-admission', 'LOR', 4),
  ('standard-admission', 'Europass CV', 5),
  ('standard-admission', 'Admission support', 6),
  ('standard-visa', 'Visa SOP', 1),
  ('standard-visa', 'Document review', 2),
  ('standard-visa', 'VFS assistance', 3),
  ('standard-visa', 'Visa support', 4)
) AS f(slug, feature, ord) ON f.slug = p.slug;

-- Wipe old individual services and reseed canonical 9
DELETE FROM public.services_catalog WHERE kind = 'individual';

INSERT INTO public.services_catalog
  (kind, name, slug, description, price_inr, category, icon, display_order, is_active)
VALUES
  ('individual', 'General Profile Evaluation', 'general-profile-evaluation',
   'Detailed evaluation of your academic profile with actionable feedback.',
   1000, 'evaluation', 'ClipboardCheck', 1, true),
  ('individual', 'APS Help', 'aps-help',
   'Step-by-step help preparing and submitting your APS application.',
   2000, 'application', 'FileCheck', 2, true),
  ('individual', 'SOP (University Application)', 'sop-university',
   'Tailored Statement of Purpose written for your target program.',
   2500, 'writing', 'PenLine', 3, true),
  ('individual', 'Document Review & Verification', 'document-review',
   'Full review and verification of your application documents.',
   2500, 'review', 'FileSearch', 4, true),
  ('individual', 'CV / Europass CV Preparation', 'cv-preparation',
   'Professionally formatted CV or Europass CV ready for submissions.',
   3000, 'writing', 'FileText', 5, true),
  ('individual', 'LOR Preparation', 'lor-preparation',
   'Guided drafting of strong Letters of Recommendation.',
   3000, 'writing', 'Mail', 6, true),
  ('individual', 'SOP (Visa Application)', 'sop-visa',
   'Focused Statement of Purpose for your German student visa.',
   4000, 'writing', 'PenLine', 7, true),
  ('individual', 'University Shortlisting', 'university-shortlisting',
   'Curated shortlist of universities matched to your profile.',
   5000, 'evaluation', 'ListChecks', 8, true),
  ('individual', 'VFS Appointment Booking', 'vfs-booking',
   'We book and confirm your VFS visa appointment slot.',
   5000, 'visa', 'CalendarCheck', 9, true);
