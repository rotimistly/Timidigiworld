import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const token = url.pathname.split('/').pop();

    if (!token) {
      return new Response('Invalid download token', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Missing authorization', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Get user from JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response('Invalid authorization', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Validate token and get file info
    const { data: fileInfo, error: tokenError } = await supabase.rpc('validate_download_token', {
      p_token: token,
      p_user_id: user.id
    });

    if (tokenError || !fileInfo || fileInfo.length === 0) {
      console.error('Token validation failed:', tokenError);
      return new Response('Invalid or expired download token', { 
        status: 403,
        headers: corsHeaders 
      });
    }

    const { file_url, product_title } = fileInfo[0];

    if (!file_url) {
      return new Response('File not available', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    // Fetch the file from Supabase Storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('products')
      .download(file_url.replace(/^.*\/products\//, ''));

    if (fileError || !fileData) {
      console.error('File download failed:', fileError);
      return new Response('File download failed', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Get file extension for proper content type
    const fileExtension = file_url.split('.').pop()?.toLowerCase() || '';
    let contentType = 'application/octet-stream';
    
    const contentTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav'
    };

    if (contentTypes[fileExtension]) {
      contentType = contentTypes[fileExtension];
    }

    // Return the file with secure headers
    return new Response(fileData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${product_title}.${fileExtension}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Download file error:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});