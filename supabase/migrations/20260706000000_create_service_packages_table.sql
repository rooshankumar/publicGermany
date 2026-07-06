CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.service_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  description text NULL,
  price integer NOT NULL,
  advance_amount integer NULL,
  badge text NULL,
  icon text NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT service_packages_pkey PRIMARY KEY (id),
  CONSTRAINT service_packages_slug_key UNIQUE (slug)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_service_packages_active_order
  ON public.service_packages USING btree (is_active, display_order) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS trg_service_packages_updated_at ON public.service_packages;
CREATE TRIGGER trg_service_packages_updated_at
  BEFORE UPDATE ON public.service_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read service packages" ON public.service_packages;
CREATE POLICY "Public can read service packages"
  ON public.service_packages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage service packages" ON public.service_packages;
CREATE POLICY "Admins can manage service packages"
  ON public.service_packages FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.service_packages (
  title,
  slug,
  description,
  price,
  advance_amount,
  badge,
  icon,
  display_order,
  is_active
)
VALUES
  (
    'Pay After Admission',
    'pay-after-admission',
    'Admission support with minimal upfront commitment — pay the rest after your offer.',
    60000,
    2000,
    'Most Popular',
    'credit-card',
    1,
    true
  ),
  (
    'Pay After Visa',
    'pay-after-visa',
    'Visa-focused support with a low upfront amount and balance after approval.',
    25000,
    2000,
    'Pay After',
    'shield-check',
    2,
    true
  ),
  (
    'Standard Admission',
    'standard-admission',
    'Full admission support with payment before the application process starts.',
    35000,
    NULL,
    NULL,
    'school',
    3,
    true
  ),
  (
    'Standard Visa Application',
    'standard-visa-application',
    'Complete visa application support with upfront payment before the visa process.',
    20000,
    NULL,
    NULL,
    'passport',
    4,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  advance_amount = EXCLUDED.advance_amount,
  badge = EXCLUDED.badge,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();
