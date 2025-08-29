// supabase/functions/download-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const url = new URL(req.url);
  const fileUrl = url.searchParams.get('fileUrl');
  const fileName = url.searchParams.get('fileName') || 'downloaded-file';

  if (!fileUrl) {
    return new Response('Missing fileUrl parameter', { status: 400 });
  }

  // Fetch the file from the public URL
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) {
    return new Response('File not found', { status: 404 });
  }

  // Set Content-Disposition header to force download
  const headers = new Headers(fileRes.headers);
  headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

  return new Response(fileRes.body, {
    status: 200,
    headers,
  });
});
