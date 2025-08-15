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
    const { productId, paymentMethod, amount } = await req.json();

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
    const commissionRate = 0.04; // 4%
    const commissionAmount = totalAmount * commissionRate;
    const sellerAmount = totalAmount - commissionAmount;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        product_id: productId,
        buyer_id: user.id,
        amount: totalAmount,
        payment_method: paymentMethod,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        seller_amount: sellerAmount,
        status: "pending"
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Simulate payment processing (in real app, integrate with payment gateway)
    const paymentSuccessful = true; // Simulate success

    if (paymentSuccessful) {
      // Update order status
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", order.id);

      // If digital product, trigger email delivery
      if (product.product_type === "digital") {
        // Call send-digital-product function
        await supabaseAdmin.functions.invoke("send-digital-product", {
          body: { orderId: order.id }
        });
      } else {
        // For physical products, generate tracking number
        const trackingNumber = `TDW${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        await supabaseAdmin
          .from("orders")
          .update({ 
            tracking_number: trackingNumber,
            status: "processing" 
          })
          .eq("id", order.id);

        // Create notification for tracking
        await supabaseAdmin.from("order_notifications").insert({
          order_id: order.id,
          user_id: user.id,
          type: "paid",
          title: "Payment Confirmed",
          message: `Your order for "${product.title}" has been confirmed. Tracking number: ${trackingNumber}`
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        orderId: order.id,
        trackingNumber: product.product_type === "physical" ? order.tracking_number : null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error("Payment failed");
    }

  } catch (error: any) {
    console.error("Error in process-payment function:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});