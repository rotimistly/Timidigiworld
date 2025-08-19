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

    // Get order details first
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

    // Get buyer profile for additional email/name info
    const { data: buyerProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", order.buyer_id)
      .single();

    // Get buyer email - priority: delivery_email > auth email > profile email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(order.buyer_id);
    const buyerEmail = order.delivery_email || authUser.user?.email || buyerProfile?.email;

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
        <h1>Thank you for your purchase!</h1>
        <p>Hi ${buyerProfile?.full_name || 'Customer'},</p>
        <p>Your digital product "${product.title}" is ready for download.</p>
        
        ${product.file_url ? 
          `<p><a href="${product.file_url}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Your Product</a></p>` :
          '<p>Your product will be available for download shortly.</p>'
        }
        
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Product: ${product.title}</li>
          <li>Amount: $${order.amount}</li>
          <li>Order ID: ${order.id}</li>
        </ul>
        
        <p>If you have any issues, please contact our support team at Rotimistly@gmail.com or 08147838934.</p>
        <p>Best regards,<br>TimiDigiWorld Team</p>
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