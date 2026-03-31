-- Migration script to move earlier hardcoded resources to the database
-- Run this in the Supabase SQL Editor

INSERT INTO public.resources (title, description, category, type, view_url, download_url, image_url, tags)
VALUES 
-- IELTS Resources
('Cambridge IELTS 19 Academic', 'Official Cambridge IELTS 19 Academic book (PDF).', 'IELTS', 'PDF', 
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%2019%20Academic.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%2019%20Academic.pdf',
 'https://tse3.mm.bing.net/th/id/OIP.ua8f9rYf7f2g97Ste1YS5AHaEK?pid=Api', 
 ARRAY['ielts', 'cambridge', '19']),

('Cambridge IELTS 18 Academic', 'Official Cambridge IELTS 18 Academic book (PDF).', 'IELTS', 'PDF',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%2018_compressed.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%2018_compressed.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/ChatGPT%20Image%20Mar%2031,%202026,%2010_37_41%20PM.png',
 ARRAY['ielts', 'cambridge', '18']),

('Cambridge IELTS 17 Academic', 'Official Cambridge IELTS 17 Academic book (PDF).', 'IELTS', 'PDF',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%20IELTS%2017.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%20IELTS%2017.pdf',
 'https://tse4.mm.bing.net/th/id/OIP.TENWPRAiKRLgpWugzW3WpgHaHa?pid=Api',
 ARRAY['ielts', 'cambridge', '17']),

-- German Resources
('Goethe A1 Handwritten Notes', 'Official handwritten notes for Goethe A1. Ideal for beginners.', 'German', 'PDF',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A1.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A1.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
 ARRAY['goethe', 'a1', 'pdf']),

('Goethe A2 Handwritten Notes', 'Official handwritten notes for Goethe A2 exam.', 'German', 'PDF',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A2.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A2.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
 ARRAY['goethe', 'a2', 'pdf']),

('Arbeitsbuch B1.1', 'Practice workbook for German B1.1 level with exercises and solutions.', 'German', 'PDF',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/Arbeitsbuch%20B1.1.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/Arbeitsbuch%20B1.1.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
 ARRAY['german', 'b1', 'workbook']),

('German Made Simple', 'Comprehensive guide to learn German from basics to advanced level.', 'German', 'PDF',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/German%20Made%20Simple_%20Learn%20to%20Speak%20and%20Understand%20German%20Quickly%20and%20Easily%20-%20PDF%20Room.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/German%20Made%20Simple_%20Learn%20to%20Speak%20and%20Understand%20German%20Quickly%20and%20Easily%20-%20PDF%20Room.pdf',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
 ARRAY['german', 'textbook', 'comprehensive']),

-- Additional Resources
('DAAD Official Portal', 'Official German Academic Exchange Service portal.', 'Additional', 'Link',
 'https://www.daad.de/', 'https://www.daad.de/',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/ChatGPT%20Image%20Mar%2031,%202026,%2010_39_41%20PM.png',
 ARRAY['daad', 'study', 'germany']),

('Uni-assist Portal', 'Application portal for German universities.', 'Additional', 'Link',
 'https://www.uni-assist.de/en/', 'https://www.uni-assist.de/en/',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/ChatGPT%20Image%20Mar%2031,%202026,%2010_39_41%20PM.png',
 ARRAY['uni-assist', 'applications']),

('APS India Academic Evaluation', 'Official APS evaluation for Indian applicants.', 'Additional', 'Link',
 'https://www.aps-india.de/en/', 'https://www.aps-india.co.in/',
 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/ChatGPT%20Image%20Mar%2031,%202026,%2010_39_41%20PM.png',
 ARRAY['aps', 'india']);
