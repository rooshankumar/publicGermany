-- Add policy to allow anyone to count completed service requests (for homepage stats)
CREATE POLICY "Anyone can count completed services"
ON public.service_requests
FOR SELECT
USING (status = 'completed');