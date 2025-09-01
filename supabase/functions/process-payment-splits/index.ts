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

  console.log("Payment splits processing started");
  
  try {
    const { orderId } = await req.json();
    
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get order details with product and seller information
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        products (
          seller_id,
          title,
          product_type
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const totalAmount = parseFloat(order.amount.toString());
    const platformAmount = totalAmount * 0.25; // 25% platform fee
    const sellerAmount = totalAmount * 0.75;  // 75% to seller

    console.log("Processing payment split:", {
      orderId,
      totalAmount,
      platformAmount,
      sellerAmount,
      sellerId: order.products.seller_id
    });

    // Get seller's bank details
    const { data: sellerProfile } = await supabaseAdmin
      .from("profiles")
      .select("bank_name, account_number, account_name, bank_code")
      .eq("user_id", order.products.seller_id)
      .single();

    if (!sellerProfile?.bank_name || !sellerProfile?.account_number) {
      console.log("Seller bank details not complete, skipping transfer");
      
      // Still record the split for tracking
      await supabaseAdmin.from("payment_splits_new").insert({
        order_id: orderId,
        buyer_id: order.buyer_id,
        product_id: order.product_id,
        total_amount: totalAmount,
        platform_amount: platformAmount,
        seller_amount: sellerAmount,
        platform_paid: true, // Platform gets paid immediately
        seller_paid: false   // Seller needs to complete bank details
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Payment split recorded, seller needs to complete bank details for transfer",
        platformAmount,
        sellerAmount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Simulate immediate bank transfer to seller (in real implementation, use Paystack Transfer API)
    const transferReference = `SELLER_${Date.now()}_${orderId}`;
    
    console.log("Simulating bank transfer to seller:", {
      amount: sellerAmount,
      bankName: sellerProfile.bank_name,
      accountNumber: sellerProfile.account_number,
      accountName: sellerProfile.account_name
    });

    // For now, we'll simulate successful transfer
    // In production, you would integrate with Paystack Transfer API:
    // https://paystack.com/docs/transfers/single-transfers

    const transferSuccessful = true; // Simulate success

    // Record the payment split
    await supabaseAdmin.from("payment_splits_new").insert({
      order_id: orderId,
      buyer_id: order.buyer_id,
      product_id: order.product_id,
      total_amount: totalAmount,
      platform_amount: platformAmount,
      seller_amount: sellerAmount,
      platform_paid: true,
      seller_paid: transferSuccessful,
      seller_reference: transferSuccessful ? transferReference : null
    });

    // Create notification for seller
    await supabaseAdmin.from("order_notifications").insert({
      order_id: orderId,
      user_id: order.products.seller_id,
      type: "payment_received",
      title: "Payment Received",
      message: `You've received ₦${sellerAmount.toFixed(2)} from the sale of "${order.products.title}". Transfer reference: ${transferReference}`
    });

    console.log("Payment split processed successfully");

    return new Response(JSON.stringify({
      success: true,
      message: "Payment split processed successfully",
      platformAmount,
      sellerAmount,
      transferReference: transferSuccessful ? transferReference : null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error processing payment splits:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});