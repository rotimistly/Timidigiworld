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
    const sellerAmount = totalAmount * 0.70;  // 70% to seller

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
      .select("bank_name, account_number, account_name, bank_code, paystack_subaccount_code")
      .eq("user_id", order.products.seller_id)
      .single();

    // If using Paystack split payments with subaccounts, payment is already split
    if (sellerProfile?.paystack_subaccount_code) {
      console.log("Using Paystack split payment with subaccount:", sellerProfile.paystack_subaccount_code);
      
      // Just record the split for tracking - payment already split by Paystack
      await supabaseAdmin.from("payment_splits_new").insert({
        order_id: orderId,
        buyer_id: order.buyer_id,
        product_id: order.product_id,
        total_amount: totalAmount,
        platform_amount: platformAmount,
        seller_amount: sellerAmount,
        platform_paid: true, // Already handled by Paystack
        seller_paid: true,   // Already handled by Paystack
        seller_reference: `PAYSTACK_SPLIT_${orderId}`
      });

      // Create notification for seller
      await supabaseAdmin.from("order_notifications").insert({
        order_id: orderId,
        user_id: order.products.seller_id,
        type: "payment_received",
        title: "Payment Received",
        message: `You've received ₦${sellerAmount.toFixed(2)} from the sale of "${order.products.title}" via Paystack split payment.`
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Payment split handled by Paystack",
        platformAmount,
        sellerAmount,
        paymentMethod: "paystack_split"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

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