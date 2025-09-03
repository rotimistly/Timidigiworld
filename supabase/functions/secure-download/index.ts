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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns this order and it's completed
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, product_id, status, buyer_id')
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .in('status', ['paid', 'completed', 'delivered'])
      .single();

    if (orderError || !order) {
      console.error('Order verification failed:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a secure download token
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_download_token', {
      p_order_id: order.id,
      p_user_id: user.id
    });

    if (tokenError || !tokenData) {
      console.error('Token generation failed:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate download token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get product details for download
    let product = null;
    
    // Try regular products first
    const { data: regularProduct } = await supabase
      .from('products')
      .select('title, file_url, product_type')
      .eq('id', order.product_id)
      .single();

    if (regularProduct) {
      product = regularProduct;
    } else {
      // Try admin products
      const { data: adminProduct } = await supabase
        .from('admin_products')
        .select('title, file_url, product_type')
        .eq('id', order.product_id)
        .single();
      
      if (adminProduct) {
        product = adminProduct;
      }
    }

    if (!product || !product.file_url) {
      return new Response(
        JSON.stringify({ error: 'Product file not available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a secure download URL that expires in 1 hour
    const downloadUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/download-file/${tokenData}`;

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl,
        productTitle: product.title,
        expiresIn: 3600 // 1 hour
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Secure download error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});