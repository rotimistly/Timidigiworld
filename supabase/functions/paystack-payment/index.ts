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
    const { productId, paymentMethod, amount, deliveryEmail } = await req.json();

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

    // Get product details
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      throw new Error("Product not found");
    }

    const totalAmount = parseFloat(amount);
    
    // FIXED COMMISSION: Platform gets exactly 25%, seller gets 70%
    const commissionRate = 0.25; // 25% for TimiDigiWorld
    const commissionAmount = totalAmount * commissionRate;
    const sellerAmount = totalAmount * 0.70; // 70% for seller

    // Create reference for Paystack
    const reference = `TDW${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
    }

    // Get current exchange rate for NGN
    const { data: currencyData } = await supabaseAdmin
      .from("currency_rates")
      .select("rate")
      .eq("target_currency", "NGN")
      .single();
    
    const exchangeRate = currencyData?.rate || 1600;
    const amountInNaira = Math.round(totalAmount * exchangeRate);

    // Initialize Paystack payment
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amountInNaira * 100), // Paystack expects amount in kobo
        reference,
        currency: "NGN",
        callback_url: `${req.headers.get("origin")}/payment-success`,
        metadata: {
          productId,
          userId: user.id,
          originalAmount: totalAmount,
          commissionAmount: commissionAmount,
          sellerAmount: sellerAmount,
        }
      }),
    });

    const paystackData = await paystackResponse.json();
    
    if (!paystackData.status) {
      throw new Error(paystackData.message || "Payment initialization failed");
    }

    // Create order record
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
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

  } catch (error: any) {
    console.error("Error in paystack-payment function:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});