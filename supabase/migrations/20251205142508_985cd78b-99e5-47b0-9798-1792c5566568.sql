-- Create contracts table for service agreements
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  student_id UUID NOT NULL,
  contract_reference TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT,
  service_package TEXT NOT NULL,
  service_description TEXT,
  service_fee TEXT NOT NULL,
  payment_structure TEXT,
  start_date DATE,
  expected_end_date DATE,
  contract_html TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed_by_admin', 'sent', 'viewed', 'completed')),
  admin_signature_url TEXT,
  admin_signed_at TIMESTAMP WITH TIME ZONE,
  student_signature_url TEXT,
  student_signed_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all contracts" ON public.contracts
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Students can view their own contracts" ON public.contracts
FOR SELECT USING (student_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_contracts_student_id ON public.contracts(student_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);