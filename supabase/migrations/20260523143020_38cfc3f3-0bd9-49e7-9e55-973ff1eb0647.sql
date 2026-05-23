CREATE TABLE public.manual_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  service_name text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'received',
  payment_method text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  admin_note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage manual payments"
ON public.manual_payments
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_manual_payments_updated_at
BEFORE UPDATE ON public.manual_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_manual_payments_paid_at ON public.manual_payments(paid_at DESC);