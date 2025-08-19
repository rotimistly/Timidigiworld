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

    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      throw new Error("Payment gateway configuration error");
    }

    // Verify payment with Paystack
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

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // First, get the order
    const { data: order, error: orderFindError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("paystack_reference", reference)
      .single();

    if (orderFindError || !order) {
      console.error("Order not found:", orderFindError, "Reference:", reference);
      throw new Error("Order not found for this payment reference");
    }

    // Then get the product separately
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", order.product_id)
      .single();

    if (productError || !product) {
      console.error("Product not found:", productError);
      throw new Error("Product not found");
    }

    // Prepare combined order and status without forcing an intermediate 'paid' state
    const orderWithProduct = {
      ...order,
      product
    };
    let finalStatus = order.status;

    console.log("Order loaded successfully:", orderWithProduct.id, "Product type:", product.product_type);

    // Process based on product type
    if (product.product_type === "digital") {
      console.log("Processing digital product delivery");
      // Trigger email delivery for digital products IMMEDIATELY
      const { data: emailResult, error: emailError } = await supabaseAdmin.functions.invoke("send-digital-product", {
        body: { 
          orderId: orderWithProduct.id, 
          productId: product.id,
          deliveryEmail: orderWithProduct.delivery_email || verificationData.data.customer?.email
        }
      });

      if (emailError) {
        console.error("Failed to send digital product email:", emailError);
        // Don't throw error here - payment is still successful
      } else {
        console.log("Digital product email sent successfully");
      }

      // Update order status to completed for digital products
      await supabaseAdmin
        .from("orders")
        .update({ 
          status: "completed",
          email_sent: true
        })
        .eq("id", orderWithProduct.id);
      finalStatus = "completed";

    } else {
      console.log("Processing physical product");
      // For physical products, generate tracking number
      const trackingNumber = `TDW${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await supabaseAdmin
        .from("orders")
        .update({ 
          tracking_number: trackingNumber,
          status: "processing" 
        })
        .eq("id", orderWithProduct.id);
      finalStatus = "processing";

      // Create notification for tracking
      const { error: notificationError } = await supabaseAdmin.from("order_notifications").insert({
        order_id: orderWithProduct.id,
        user_id: orderWithProduct.buyer_id,
        type: "paid",
        title: "Payment Confirmed",
        message: `Your order for "${product.title}" has been confirmed. Tracking number: ${trackingNumber}`
      });

      if (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }
    }

    console.log("Payment verification completed successfully");

    return new Response(JSON.stringify({ 
      success: true,
      orderId: orderWithProduct.id,
      status: finalStatus,
      productType: product.product_type,
      order: { ...orderWithProduct, status: finalStatus }
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