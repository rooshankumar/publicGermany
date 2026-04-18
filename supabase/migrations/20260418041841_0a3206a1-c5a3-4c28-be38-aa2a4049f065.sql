-- Update package descriptions, prices, and add Pay After Admission
UPDATE public.services_catalog SET
  description = E'Full end-to-end admission support from profile building to offer letter — 7 to 8 university applications included.\n\nWhat''s included:\n• Profile evaluation & university shortlisting\n• SOP, LOR & CV preparation\n• 7–8 university applications handled\n• All application documents prepared for you\n• APS guidance (if applicable)\n\nNote: Application fees are paid directly by the student.',
  price_inr = 30000,
  price_range_inr = '30000',
  is_active = true,
  updated_at = now()
WHERE name = 'Admission Package';

UPDATE public.services_catalog SET
  description = E'Everything in the Admission Package plus complete visa support after you receive your offer letter.\n\nWhat''s included:\n• All admission services included\n• Visa SOP & document preparation\n• VFS appointment booking & guidance\n• Blocked account opening assistance\n• Education loan guidance & assistance\n• Accommodation search support\n\nNote: Application fees are paid directly by the student.',
  price_inr = 50000,
  price_range_inr = '50000',
  is_active = true,
  updated_at = now()
WHERE name = 'Visa Package';

INSERT INTO public.services_catalog (name, kind, price_inr, price_range_inr, is_active, description)
SELECT 'Pay After Admission', 'package', 60000, '60000', true,
E'Same complete admission support — but you pay only after securing your university admission. Higher fee, zero upfront risk.\n\nWhat''s included:\n• Profile evaluation & university shortlisting\n• SOP, LOR & CV preparation\n• 7–8 university applications handled\n• All application documents prepared for you\n• APS guidance (if applicable)\n\nNote: Fee is due only after receiving your admission offer. Application fees are paid directly by the student. Visa support available separately at ₹20,000.'
WHERE NOT EXISTS (SELECT 1 FROM public.services_catalog WHERE name = 'Pay After Admission');

-- Refine individual service descriptions
UPDATE public.services_catalog SET description = 'Quick evaluation with actionable next steps for Germany studies.', updated_at = now() WHERE name = 'General Profile Evaluation';
UPDATE public.services_catalog SET description = 'Guidance and full assistance with APS certificate application.', updated_at = now() WHERE name = 'APS Help';
UPDATE public.services_catalog SET description = 'Additional SOP for different programs or universities.', updated_at = now() WHERE name = 'SOP (Additional)';
UPDATE public.services_catalog SET description = 'Statement of Purpose — first draft with personalized revisions.', updated_at = now() WHERE name = 'SOP (1st Draft)';
UPDATE public.services_catalog SET description = 'Letter of Recommendation templates and custom samples.', updated_at = now() WHERE name = 'LOR Samples';
UPDATE public.services_catalog SET description = 'Professional CV tailored for German university applications.', updated_at = now() WHERE name = 'CV Preparation';
UPDATE public.services_catalog SET description = 'Personalised university recommendations based on your profile.', updated_at = now() WHERE name = 'University Shortlisting';
UPDATE public.services_catalog SET description = 'Guidance and appointment booking for VFS Germany visa submission.', updated_at = now() WHERE name = 'VFS Appointment Booking';
UPDATE public.services_catalog SET description = 'Statement of Purpose written specifically for visa application.', updated_at = now() WHERE name = 'Visa SOP';
UPDATE public.services_catalog SET description = 'Visa document prep, Visa SOP, and VFS appointment booking — standalone.', updated_at = now() WHERE name = 'Visa Application Only';