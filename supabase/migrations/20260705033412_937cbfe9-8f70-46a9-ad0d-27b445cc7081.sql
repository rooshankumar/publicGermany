
-- Speed up admin & student dashboard queries: add missing indexes discovered via pg_stat_statements.

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications (user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_end_date_status ON public.applications (application_end_date, status);
CREATE INDEX IF NOT EXISTS idx_applications_start_date_status ON public.applications (application_start_date, status);

CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents (status);

CREATE INDEX IF NOT EXISTS idx_service_payments_status ON public.service_payments (status);
CREATE INDEX IF NOT EXISTS idx_service_payments_status_created ON public.service_payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_user_created ON public.events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_role_updated ON public.profiles (role, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role_created ON public.profiles (role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON public.manual_payments (status);

CREATE INDEX IF NOT EXISTS idx_contracts_student_sent ON public.contracts (student_id, sent_at DESC);
