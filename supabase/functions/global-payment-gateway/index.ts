import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, paymentMethod, amount, deliveryEmail, currency = 'USD', country = 'US' } = await req.json();

    // Create Supabase client for user auth
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("User not authenticated");

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get product details - check both regular products and admin products
    let product;
    let isAdminProduct = false;
    
    const { data: regularProduct } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (regularProduct) {
      product = regularProduct;
    } else {
      const { data: adminProduct } = await supabaseAdmin
        .from("admin_products")
        .select("*")
        .eq("id", productId)
        .single();
      
      if (adminProduct) {
        product = adminProduct;
        isAdminProduct = true;
      }
    }

    if (!product) {
      throw new Error("Product not found");
    }

    // Get currency conversion rate
    let exchangeRate = 1;
    if (currency !== 'USD') {
      const { data: rateData } = await supabaseAdmin
        .from("currency_rates")
        .select("rate")
        .eq("target_currency", currency)
        .single();
      
      exchangeRate = rateData?.rate || 1;
    }

    const totalAmount = parseFloat(amount);
    const convertedAmount = totalAmount * exchangeRate;
    
    // Commission logic - admin products get 100%, regular products get 75%
    const commissionRate = isAdminProduct ? 0 : 0.25;
    const commissionAmount = totalAmount * commissionRate;
    const sellerAmount = totalAmount - commissionAmount;

    // Create reference for payment gateway
    const reference = `TDW${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    let paymentResponse;

    // Route to appropriate payment gateway based on country/currency
    if (currency === 'NGN' || country === 'NG') {
      // Use Paystack for Nigerian payments
      const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
      if (!paystackSecretKey) {
        throw new Error("Paystack configuration not available");
      }

      paymentResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(convertedAmount * 100), // Paystack expects amount in kobo
          reference,
          currency: "NGN",
          callback_url: `${req.headers.get("origin")}/payment-success`,
          metadata: {
            productId,
            userId: user.id,
            isAdminProduct,
            commissionAmount: commissionAmount * 100,
            sellerAmount: sellerAmount * 100,
          }
        }),
      });

      const paystackData = await paymentResponse.json();
      
      if (!paystackData.status) {
        throw new Error(paystackData.message || "Payment initialization failed");
      }

      // Create order record
      const orderTable = isAdminProduct ? 'orders' : 'orders';
      const { data: order, error: orderError } = await supabaseAdmin
        .from(orderTable)
        .insert({
          product_id: productId,
          buyer_id: user.id,
          amount: totalAmount,
          payment_method: paymentMethod,
          payment_gateway: "paystack",
          paystack_reference: reference,
          delivery_email: deliveryEmail,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          seller_amount: sellerAmount,
          status: "pending"
        })
        .select()
        .single();

      if (orderError) throw orderError;

      return new Response(JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        reference,
        orderId: order.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // For other currencies, simulate or use other gateways
      // This is a placeholder - you would integrate with Stripe, PayPal, etc.
      const simulatedPaymentUrl = `${req.headers.get("origin")}/payment-success?ref=${reference}&status=success`;
      
      // Create order record
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          product_id: productId,
          buyer_id: user.id,
          amount: totalAmount,
          payment_method: paymentMethod,
          payment_gateway: "simulation",
          paystack_reference: reference,
          delivery_email: deliveryEmail,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          seller_amount: sellerAmount,
          status: "paid" // Simulated as paid
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // For simulation, process the order immediately
      if (product.product_type === 'digital') {
        await supabaseAdmin.functions.invoke('send-digital-product', {
          body: { orderId: order.id, productId, deliveryEmail }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        authorization_url: simulatedPaymentUrl,
        reference,
        orderId: order.id,
        simulated: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error: any) {
    console.error("Error in global-payment-gateway function:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});