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
    const { reference } = await req.json();

    if (!reference) {
      throw new Error("Payment reference is required");
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
    });

    const verificationData = await verifyResponse.json();
    
    if (!verificationData.status || verificationData.data.status !== "success") {
      throw new Error("Payment verification failed");
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Update order status
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .update({ 
        status: "paid",
        updated_at: new Date().toISOString()
      })
      .eq("paystack_reference", reference)
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found or update failed");
    }

    // Process based on product type
    if (order.product.product_type === "digital") {
      // Trigger email delivery for digital products IMMEDIATELY
      await supabaseAdmin.functions.invoke("send-digital-product", {
        body: { 
          orderId: order.id, 
          productId: order.product.id,
          deliveryEmail: order.delivery_email || verificationData.data.customer?.email
        }
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
        user_id: order.buyer_id,
        type: "paid",
        title: "Payment Confirmed",
        message: `Your order for "${order.product.title}" has been confirmed. Tracking number: ${trackingNumber}`
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      order,
      verification: verificationData.data
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in verify-paystack-payment function:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});