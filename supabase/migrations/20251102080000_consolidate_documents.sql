-- Consolidate files table into documents table
-- Add module column to documents table to support additional documents
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS module TEXT;

-- Add comment
COMMENT ON COLUMN public.documents.module IS 'Module/category type: null for APS required docs, "additional_documents" for custom uploads, or other module names';

-- Migrate existing data from files table to documents table
-- Only migrate if files table exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
    INSERT INTO public.documents (
      user_id,
      file_name,
      file_size,
      file_type,
      file_url,
      category,
      upload_path,
      module,
      status,
      created_at,
      updated_at
    )
    SELECT 
      f.user_id,
      f.file_name,
      COALESCE(f.file_size, 0)::BIGINT,
      COALESCE(f.file_type, f.mime_type, 'application/octet-stream'),
      -- Generate public URL from file_path (will need to be regenerated properly)
      '',  -- Empty for now, will be set when file is accessed
      'additional', -- Use 'additional' as category for migrated files
      f.file_path,
      COALESCE(f.module, 'additional_documents'),
      'pending', -- Default status for all migrated files
      f.created_at,
      f.created_at
    FROM public.files f
    WHERE NOT EXISTS (
      -- Avoid duplicates if migration runs multiple times
      SELECT 1 FROM public.documents d 
      WHERE d.upload_path = f.file_path
    );
  END IF;
END $$;

-- Note: We're keeping the files table for now to avoid breaking existing code
-- After verifying the migration works, you can drop it with:
-- DROP TABLE public.files CASCADE;
