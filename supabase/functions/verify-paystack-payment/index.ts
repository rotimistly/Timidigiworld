import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Payment verification request received");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();
    console.log("Verifying payment reference:", reference);

    if (!reference) {
      console.error("No payment reference provided");
      throw new Error("Payment reference is required");
    }

    // Create Supabase admin client early to check order state first
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Load order by reference
    const { data: order, error: orderFindError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (orderFindError || !order) {
      console.error("Order not found:", orderFindError, "Reference:", reference);
      throw new Error("Order not found for this payment reference");
    }

    // Load product
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", order.product_id)
      .single();

    if (productError || !product) {
      console.error("Product not found:", productError);
      throw new Error("Product not found");
    }

    const respondSuccess = async (updatedOrder: any) => {
      console.log("Payment verification completed successfully");
      return new Response(JSON.stringify({
        success: true,
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        productType: product.product_type,
        order: { ...updatedOrder, product }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    };

    // If already completed/delivered, just return success (idempotent)
    if (order.status === "completed" || order.status === "delivered") {
      if (product.product_type === "digital" && !order.email_sent) {
        const { error: emailError } = await supabaseAdmin.functions.invoke("send-digital-product", {
          body: {
            orderId: order.id,
            productId: product.id,
            deliveryEmail: order.delivery_email
          }
        });
        if (emailError) console.error("Email send after-complete failed:", emailError);
        await supabaseAdmin.from("orders").update({ email_sent: true }).eq("id", order.id);
      }
      return respondSuccess({ ...order, status: order.status });
    }

    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    // If Paystack key is missing, gracefully finalize based on product type
    if (!paystackSecretKey) {
      console.warn("PAYSTACK_SECRET_KEY not configured - finalizing order without external verification");
      let finalOrder = { ...order } as any;

      if (product.product_type === "digital") {
        const { error: emailError } = await supabaseAdmin.functions.invoke("send-digital-product", {
          body: {
            orderId: order.id,
            productId: product.id,
            deliveryEmail: order.delivery_email
          }
        });
        if (emailError) console.error("Failed to send digital product email:", emailError);
        const { data: upd } = await supabaseAdmin
          .from("orders")
          .update({ status: "completed", email_sent: true })
          .eq("id", order.id)
          .select("*")
          .single();
        finalOrder = upd || { ...order, status: "completed", email_sent: true };
      } else {
        const trackingNumber = `TDW${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const { data: upd } = await supabaseAdmin
          .from("orders")
          .update({ status: "completed", tracking_number: trackingNumber })
          .eq("id", order.id)
          .select("*")
          .single();
        await supabaseAdmin.from("order_notifications").insert({
          order_id: order.id,
          user_id: order.buyer_id,
          type: "paid",
          title: "Payment Confirmed",
          message: `Your order for "${product.title}" has been confirmed. Tracking number: ${trackingNumber}`
        });
        finalOrder = upd || { ...order, status: "completed", tracking_number: trackingNumber };
      }

      return respondSuccess(finalOrder);
    }

    // Otherwise verify with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
    });

    const verificationData = await verifyResponse.json();
    console.log("Paystack verification response:", verificationData);
    
    if (!verificationData.status || verificationData.data.status !== "success") {
      console.error("Payment verification failed:", verificationData);
      throw new Error(`Payment verification failed: ${verificationData.message || 'Transaction not successful'}`);
    }

    let finalOrder = { ...order } as any;

    if (product.product_type === "digital") {
      const { error: emailError } = await supabaseAdmin.functions.invoke("send-digital-product", {
        body: { 
          orderId: order.id, 
          productId: product.id,
          deliveryEmail: order.delivery_email || verificationData.data.customer?.email
        }
      });
      if (emailError) console.error("Failed to send digital product email:", emailError);
      const { data: upd } = await supabaseAdmin
        .from("orders")
        .update({ status: "completed", email_sent: true })
        .eq("id", order.id)
        .select("*")
        .single();
      finalOrder = upd || { ...order, status: "completed", email_sent: true };
    } else {
      const trackingNumber = `TDW${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const { data: upd } = await supabaseAdmin
        .from("orders")
        .update({ tracking_number: trackingNumber, status: "completed" })
        .eq("id", order.id)
        .select("*")
        .single();
      await supabaseAdmin.from("order_notifications").insert({
        order_id: order.id,
        user_id: order.buyer_id,
        type: "paid",
        title: "Payment Confirmed",
        message: `Your order for "${product.title}" has been confirmed. Tracking number: ${trackingNumber}`
      });
      finalOrder = upd || { ...order, status: "completed", tracking_number: trackingNumber };
    }

    return respondSuccess(finalOrder);

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