import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const fileIndex = parseInt(searchParams.get('fileIndex') || '0', 10);

    if (!requestId) {
      return new NextResponse('Missing requestId', { status: 400 });
    }

    // Create authenticated Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get service request to verify ownership
    const { data: request, error: requestError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return new NextResponse('Service request not found', { status: 404 });
    }

    // Verify user owns this request
    if (request.user_id !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Get file list from storage
    const { data: files, error: storageError } = await supabase.storage
      .from('documents')
      .list(`service_requests/${requestId}`);

    if (storageError || !files || !files[fileIndex]) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Generate signed URL for the file (valid for 60 seconds)
    const file = files[fileIndex];
    const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(`service_requests/${requestId}/${file.name}`, 60);

    if (signedUrlError || !signedUrl) {
      return new NextResponse('Could not generate download URL', { status: 500 });
    }

    // Redirect to signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}