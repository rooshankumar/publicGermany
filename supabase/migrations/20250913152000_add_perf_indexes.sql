-- Performance indexes
-- Documents: queries by user and category
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_category ON public.documents(user_id, category);

-- Reviews: public list by approval/date and user views by user_id
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved_created ON public.reviews(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

-- Service requests and payments: usually filtered by user and sorted by date
CREATE INDEX IF NOT EXISTS idx_service_requests_user_created ON public.service_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_payments_user_created ON public.service_payments(user_id, created_at DESC);

-- Profiles by user_id (lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
