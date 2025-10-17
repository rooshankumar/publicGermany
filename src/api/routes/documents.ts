import { Router } from 'express';
import { supabase } from '@/integrations/supabase/client';

const router = Router();

router.get('/documents/:token', async (req, res) => {
  try {
    // Decode and validate the token
    let fileInfo;
    try {
      const decoded = atob(req.params.token);
      fileInfo = JSON.parse(decoded);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid download token' });
    }

    const { requestId, fileIndex, timestamp } = fileInfo;

    // Check if token is expired (valid for 24 hours)
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: 'Download link expired' });
    }

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      // If not authenticated, redirect to login with return URL
      const loginUrl = `${req.protocol}://${req.get('host')}/auth?redirectTo=${encodeURIComponent(req.originalUrl)}`;
      return res.redirect(loginUrl);
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

    if (storageError || !files || !files[fileIndex]) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Generate signed URL for the file (valid for 60 seconds)
    const file = files[fileIndex];
    const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(`service_requests/${requestId}/${file.name}`, 60);

    if (signedUrlError || !signedUrl) {
      return res.status(500).json({ error: 'Could not generate download URL' });
    }

    // Redirect to signed URL for download
    res.redirect(signedUrl);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;