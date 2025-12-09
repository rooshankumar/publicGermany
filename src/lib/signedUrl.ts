import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a signed URL for a file in Supabase Storage.
 * Signed URLs are time-limited and don't require authentication to access.
 * @param bucket - Storage bucket name (e.g., 'documents')
 * @param path - Full path to file in bucket (e.g., 'contracts/user-id/file.pdf')
 * @param expiresIn - Expiry time in seconds (default: 7 days = 604800)
 * @returns Signed URL string, or empty string on error
 */
export async function getSignedPdfUrl(
  bucket: string,
  path: string,
  expiresIn: number = 604800 // 7 days
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return '';
    }

    return data.signedUrl || '';
  } catch (err) {
    console.error('Failed to generate signed URL:', err);
    return '';
  }
}

/**
 * Generate a signed URL for contract PDF with custom expiry.
 * Defaults to 7 days expiry.
 */
export async function getContractSignedUrl(
  studentId: string,
  fileName: string,
  expiresIn?: number
): Promise<string> {
  const path = `contracts/${studentId}/${fileName}`;
  return getSignedPdfUrl('documents', path, expiresIn);
}
