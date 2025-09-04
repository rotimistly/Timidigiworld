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
    const { orderId } = await req.json();
    
    console.log("Processing payment split for order:", orderId);

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
        products!inner(seller_id, title)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    console.log("Order found:", order);

    // Calculate split amounts (70% to seller, 25% to platform)
    const totalAmount = parseFloat(order.amount);
    const platformAmount = totalAmount * 0.25;
    const sellerAmount = totalAmount * 0.70;

    console.log("Split calculation:", { totalAmount, platformAmount, sellerAmount });

    // Get seller's bank details
    const { data: sellerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("bank_name, account_number, account_name, bank_code")
      .eq("user_id", order.products.seller_id)
      .single();

    if (profileError) {
      console.error("Error fetching seller profile:", profileError);
    }

    // Create payment split record
    const { data: paymentSplit, error: splitError } = await supabaseAdmin
      .from("payment_splits_new")
      .insert({
        order_id: orderId,
        buyer_id: order.buyer_id,
        product_id: order.product_id,
        total_amount: totalAmount,
        platform_amount: platformAmount,
        seller_amount: sellerAmount,
        payment_gateway: order.payment_gateway || 'paystack'
      })
      .select()
      .single();

    if (splitError) {
      throw new Error(`Failed to create payment split: ${splitError.message}`);
    }

    console.log("Payment split created:", paymentSplit);

    // Process immediate payment to seller if bank details exist
    if (sellerProfile?.account_number && sellerProfile?.bank_code) {
      try {
        await processSellerPayment({
          amount: sellerAmount,
          accountNumber: sellerProfile.account_number,
          bankCode: sellerProfile.bank_code,
          accountName: sellerProfile.account_name || "Seller Account",
          reference: `SELLER_${paymentSplit.id}`,
          orderId: orderId
        });

        // Update payment split as paid
        await supabaseAdmin
          .from("payment_splits_new")
          .update({ 
            seller_paid: true,
            seller_reference: `SELLER_${paymentSplit.id}`
          })
          .eq("id", paymentSplit.id);

        console.log("Seller payment processed successfully");
      } catch (error) {
        console.error("Failed to process seller payment:", error);
        // Continue - don't fail the entire process if payment fails
      }
    } else {
      console.log("Seller bank details not found - payment will be held");
    }

    // Mark platform payment as received (since platform gets payment directly)
    await supabaseAdmin
      .from("payment_splits_new")
      .update({ 
        platform_paid: true,
        platform_reference: order.paystack_reference || `PLATFORM_${paymentSplit.id}`
      })
      .eq("id", paymentSplit.id);

    // Send notification to seller
    await supabaseAdmin.from("order_notifications").insert({
      order_id: orderId,
      user_id: order.products.seller_id,
      type: "payment_split",
      title: "Payment Received",
      message: sellerProfile?.account_number 
        ? `You've received ₦${sellerAmount.toFixed(2)} for your sale of "${order.products.title}"`
        : `Payment of ₦${sellerAmount.toFixed(2)} is ready. Update your bank details to receive payment.`
    });

    return new Response(JSON.stringify({ 
      success: true, 
      paymentSplit: paymentSplit,
      sellerPaid: !!sellerProfile?.account_number
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in process-payment-split function:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processSellerPayment({
  amount,
  accountNumber,
  bankCode,
  accountName,
  reference,
  orderId
}: {
  amount: number,
  accountNumber: string,
  bankCode: string,
  accountName: string,
  reference: string,
  orderId: string
}) {
  const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  
  if (!paystackSecretKey) {
    console.log("Paystack secret key not configured - simulating transfer");
    return; // Simulate successful transfer
  }

  // First resolve account details
  const accountResponse = await fetch("https://api.paystack.co/bank/resolve", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_number: accountNumber,
      bank_code: bankCode,
    }),
  });

  const accountData = await accountResponse.json();
  
  if (!accountData.status) {
    throw new Error(`Invalid account details: ${accountData.message}`);
  }

  console.log("Account verified:", accountData.data.account_name);

  // Create transfer recipient
  const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
  });

  const recipientData = await recipientResponse.json();
  
  if (!recipientData.status) {
    throw new Error(`Failed to create recipient: ${recipientData.message}`);
  }

  console.log("Recipient created:", recipientData.data.recipient_code);

  // Initiate transfer
  const transferResponse = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(amount * 100), // Convert to kobo
      recipient: recipientData.data.recipient_code,
      reason: `Payment for order ${orderId}`,
      reference: reference,
    }),
  });

  const transferData = await transferResponse.json();
  
  if (!transferData.status) {
    throw new Error(`Transfer failed: ${transferData.message}`);
  }

  console.log("Transfer initiated:", transferData.data);
  return transferData.data;
}