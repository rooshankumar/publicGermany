
-- =========== REFERRALS ===========
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_editor_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  whatsapp text,
  email text,
  city text,
  state text,
  qualification text,
  percentage text,
  passing_year text,
  passport_available boolean DEFAULT false,
  german_level text,
  preferred_intake text,
  lead_source text,
  current_status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'medium',
  next_followup_date date,
  remarks text,
  commission_status text NOT NULL DEFAULT 'pending',
  converted_student_id uuid,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors manage own referrals" ON public.referrals FOR ALL TO authenticated
  USING (owner_editor_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (owner_editor_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE INDEX idx_referrals_owner ON public.referrals(owner_editor_id);
CREATE INDEX idx_referrals_status ON public.referrals(current_status);
CREATE INDEX idx_referrals_followup ON public.referrals(next_followup_date);
CREATE INDEX idx_referrals_priority ON public.referrals(priority);

CREATE TRIGGER trg_referrals_updated_at BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== REFERRAL SERVICES ===========
CREATE TABLE public.referral_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  service_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referral_id, service_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_services TO authenticated;
GRANT ALL ON public.referral_services TO service_role;
ALTER TABLE public.referral_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Editors manage own referral services" ON public.referral_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.referrals r WHERE r.id = referral_id AND (r.owner_editor_id = auth.uid() OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.referrals r WHERE r.id = referral_id AND (r.owner_editor_id = auth.uid() OR public.is_admin(auth.uid()))));
CREATE INDEX idx_referral_services_ref ON public.referral_services(referral_id);

-- =========== REFERRAL ACTIVITIES ===========
CREATE TABLE public.referral_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  actor_user_id uuid,
  type text NOT NULL,
  title text,
  body text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.referral_activities TO authenticated;
GRANT ALL ON public.referral_activities TO service_role;
ALTER TABLE public.referral_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View activities for accessible referrals" ON public.referral_activities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.referrals r WHERE r.id = referral_id AND (r.owner_editor_id = auth.uid() OR public.is_admin(auth.uid()))));
CREATE POLICY "Insert activities for accessible referrals" ON public.referral_activities FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.referrals r WHERE r.id = referral_id AND (r.owner_editor_id = auth.uid() OR public.is_admin(auth.uid()))));
CREATE INDEX idx_referral_activities_ref ON public.referral_activities(referral_id, created_at DESC);

-- =========== REFERRAL TASKS ===========
CREATE TABLE public.referral_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  owner_editor_id uuid NOT NULL,
  title text NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_tasks TO authenticated;
GRANT ALL ON public.referral_tasks TO service_role;
ALTER TABLE public.referral_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Editors manage own referral tasks" ON public.referral_tasks FOR ALL TO authenticated
  USING (owner_editor_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (owner_editor_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE INDEX idx_referral_tasks_owner ON public.referral_tasks(owner_editor_id, status, due_date);
CREATE INDEX idx_referral_tasks_ref ON public.referral_tasks(referral_id);
CREATE TRIGGER trg_referral_tasks_updated_at BEFORE UPDATE ON public.referral_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== REFERRAL DOCUMENTS ===========
CREATE TABLE public.referral_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  uploaded_by uuid,
  category text,
  file_name text NOT NULL,
  file_url text NOT NULL,
  mime text,
  size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_documents TO authenticated;
GRANT ALL ON public.referral_documents TO service_role;
ALTER TABLE public.referral_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage docs for accessible referrals" ON public.referral_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.referrals r WHERE r.id = referral_id AND (r.owner_editor_id = auth.uid() OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.referrals r WHERE r.id = referral_id AND (r.owner_editor_id = auth.uid() OR public.is_admin(auth.uid()))));
CREATE INDEX idx_referral_documents_ref ON public.referral_documents(referral_id);

-- =========== TRIGGERS: activity log ===========
CREATE OR REPLACE FUNCTION public.log_referral_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.referral_activities(referral_id, actor_user_id, type, title)
  VALUES (NEW.id, NEW.owner_editor_id, 'created', 'Referral created');
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_referral_created AFTER INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.log_referral_created();

CREATE OR REPLACE FUNCTION public.log_referral_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.current_status IS DISTINCT FROM OLD.current_status THEN
    INSERT INTO public.referral_activities(referral_id, actor_user_id, type, title, meta)
    VALUES (NEW.id, auth.uid(), 'status_change',
            'Status: ' || OLD.current_status || ' → ' || NEW.current_status,
            jsonb_build_object('from', OLD.current_status, 'to', NEW.current_status));
  END IF;
  IF NEW.converted_student_id IS DISTINCT FROM OLD.converted_student_id AND NEW.converted_student_id IS NOT NULL THEN
    INSERT INTO public.referral_activities(referral_id, actor_user_id, type, title, meta)
    VALUES (NEW.id, auth.uid(), 'converted', 'Converted to student',
            jsonb_build_object('student_id', NEW.converted_student_id));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_referral_status AFTER UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.log_referral_status_change();
