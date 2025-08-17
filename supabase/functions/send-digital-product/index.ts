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

    // Get order details with product and buyer info
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        product:products(*),
        buyer:profiles!orders_buyer_id_fkey(full_name, email)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Only process digital products
    if (order.product.product_type !== "digital") {
      throw new Error("This endpoint is only for digital products");
    }

    // Get buyer email - priority: delivery_email > profile email > auth email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(order.buyer_id);
    const buyerEmail = order.delivery_email || order.buyer?.email || authUser.user?.email;

    if (!buyerEmail) {
      throw new Error("Buyer email not found");
    }

    // Send email with digital product
    const emailResponse = await resend.emails.send({
      from: "TimiDigiWorld <noreply@timidigitworld.com>",
      to: [buyerEmail],
      subject: `Your Digital Product: ${order.product.title}`,
      html: `
        <h1>Thank you for your purchase!</h1>
        <p>Hi ${order.buyer?.full_name || 'Customer'},</p>
        <p>Your digital product "${order.product.title}" is ready for download.</p>
        
        ${order.product.file_url ? 
          `<p><a href="${order.product.file_url}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Your Product</a></p>` :
          '<p>Your product will be available for download shortly.</p>'
        }
        
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Product: ${order.product.title}</li>
          <li>Amount: $${order.amount}</li>
          <li>Order ID: ${order.id}</li>
        </ul>
        
        <p>If you have any issues, please contact our support team.</p>
        <p>Best regards,<br>TimiDigiWorld Team</p>
      `,
    });

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
    await supabaseAdmin.from("order_notifications").insert({
      order_id: orderId,
      user_id: order.buyer_id,
      type: "delivered",
      title: "Digital Product Delivered",
      message: `Your digital product "${order.product.title}" has been sent to your email.`
    });

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