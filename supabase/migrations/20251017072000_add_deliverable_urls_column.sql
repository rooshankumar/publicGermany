-- Add deliverable_urls column to service_requests table to support multiple file uploads
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS deliverable_urls TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN public.service_requests.deliverable_urls IS 'Array of URLs for deliverable files uploaded by admin';
