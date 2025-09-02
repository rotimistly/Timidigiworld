import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Processing digital product delivery for order:", orderId);

    // Get order details 
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      throw new Error("Order not found");
    }

    // Get product details separately
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", order.product_id)
      .single();

    if (productError || !product) {
      console.error("Product not found:", productError);
      throw new Error("Product not found");
    }

    // Only process digital products
    if (product.product_type !== "digital") {
      throw new Error("This endpoint is only for digital products");
    }

    // Get buyer profile and auth info
    const [authUserResult, profileResult] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(order.buyer_id),
      supabaseAdmin.from("profiles").select("full_name").eq("user_id", order.buyer_id).single()
    ]);
    
    // Priority: delivery_email > auth email
    const buyerEmail = order.delivery_email || authUserResult.data?.user?.email;
    const buyerName = profileResult.data?.full_name || authUserResult.data?.user?.user_metadata?.full_name || 'Customer';

    if (!buyerEmail) {
      console.error("No buyer email found for order:", orderId);
      throw new Error("Buyer email not found");
    }

    console.log("Sending digital product to:", buyerEmail);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    // Send email with digital product
    const emailResponse = await resend.emails.send({
      from: "TimiDigiWorld <onboarding@resend.dev>", // Using default resend domain
      to: [buyerEmail],
      subject: `Your Digital Product: ${product.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Thank you for your purchase!</h1>
          <p>Hi ${buyerName},</p>
          <p>Your digital product "<strong>${product.title}</strong>" is ready for download.</p>
          
          ${product.file_url ? 
            `<div style="text-align: center; margin: 30px 0;">
              <a href="${product.file_url}" 
                 style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;"
                 download>
                📥 Download Your Product
              </a>
            </div>` :
            '<p style="color: #ff6b6b;">Your product will be available for download shortly.</p>'
          }
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Product:</strong> ${product.title}</li>
              <li><strong>Amount:</strong> $${order.amount}</li>
              <li><strong>Order ID:</strong> ${order.id}</li>
              <li><strong>Purchase Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px;">If you have any issues downloading or accessing your product, please contact our support team at <a href="mailto:Rotimistly@gmail.com">Rotimistly@gmail.com</a> or call 08147838934.</p>
          <p style="color: #333; margin-top: 30px;">Best regards,<br><strong>TimiDigiWorld Team</strong></p>
        </div>
      `,
    });

    console.log("Email response:", emailResponse);

    // Update order to mark email as sent
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ 
        email_sent: true,
        status: 'completed' 
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
    }

    // Create notification for buyer
    const { error: notificationError } = await supabaseAdmin.from("order_notifications").insert({
      order_id: orderId,
      user_id: order.buyer_id,
      type: "delivered",
      title: "Digital Product Delivered",
      message: `Your digital product "${product.title}" has been sent to your email.`
    });

    if (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }

    console.log("Digital product delivery completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in send-digital-product function:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});