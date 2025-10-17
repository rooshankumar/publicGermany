import { supabase } from '@/integrations/supabase/client';
import { Request, Response } from 'express';
import { ParsedQs } from 'qs';

export async function handleDownload(req: Request, res: Response) {
  try {
    // Get query parameters and ensure they're strings
    const requestId = Array.isArray(req.query.requestId) 
      ? req.query.requestId[0] 
      : (req.query.requestId as string | undefined);
    const fileIndex = Array.isArray(req.query.fileIndex) 
      ? req.query.fileIndex[0] 
      : (req.query.fileIndex as string | undefined);
    const fileIndexNum = parseInt(String(fileIndex || '0'), 10);

    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid requestId' });
    }

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get service request to verify ownership
    const { data: request, error: requestError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Verify user owns this request
    if (request.user_id !== session.user.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Get file list from storage
    const { data: files, error: storageError } = await supabase.storage
      .from('documents')
      .list(`service_requests/${requestId}`);

    if (storageError || !files || !files[fileIndexNum]) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Generate signed URL for the file (valid for 60 seconds)
    const file = files[fileIndexNum];
    const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(`service_requests/${requestId}/${file.name}`, 60);

    if (signedUrlError || !signedUrl) {
      return res.status(500).json({ error: 'Could not generate download URL' });
    }

    // Redirect to the signed URL
    return res.redirect(signedUrl);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}