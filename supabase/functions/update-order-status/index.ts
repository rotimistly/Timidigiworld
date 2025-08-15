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
    const { orderId, status, trackingNumber } = await req.json();

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        product:products(title),
        buyer:profiles!orders_buyer_id_fkey(full_name)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const updateData: any = { status };
    let notificationTitle = "";
    let notificationMessage = "";

    switch (status) {
      case "shipped":
        updateData.shipped_at = new Date().toISOString();
        if (trackingNumber) updateData.tracking_number = trackingNumber;
        notificationTitle = "Order Shipped";
        notificationMessage = `Your order "${order.product.title}" has been shipped${trackingNumber ? ` with tracking number: ${trackingNumber}` : ''}.`;
        break;
      case "delivered":
        updateData.delivered_at = new Date().toISOString();
        notificationTitle = "Order Delivered";
        notificationMessage = `Your order "${order.product.title}" has been delivered!`;
        break;
      case "cancelled":
        notificationTitle = "Order Cancelled";
        notificationMessage = `Your order "${order.product.title}" has been cancelled.`;
        break;
    }

    // Update order
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (updateError) throw updateError;

    // Create notification
    if (notificationTitle) {
      await supabaseAdmin.from("order_notifications").insert({
        order_id: orderId,
        user_id: order.buyer_id,
        type: status,
        title: notificationTitle,
        message: notificationMessage
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      order: { ...order, ...updateData }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in update-order-status function:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});