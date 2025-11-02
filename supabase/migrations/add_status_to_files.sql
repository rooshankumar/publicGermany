-- Add status and admin_notes columns to files table for approval workflow
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_module_status ON files(module, status);

-- Add comment
COMMENT ON COLUMN files.status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN files.admin_notes IS 'Admin feedback or rejection reason';
