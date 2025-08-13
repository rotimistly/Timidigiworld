import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type: 'contact' | 'welcome' | 'order_confirmation' | 'password_reset';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, type }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to:`, to);

    const emailResponse = await resend.emails.send({
      from: "TimiDigiWorld <noreply@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Send notification to admin for contact forms
    if (type === 'contact') {
      try {
        await resend.emails.send({
          from: "TimiDigiWorld <noreply@resend.dev>",
          to: ["Rotimistly@gmail.com"],
          subject: `New Contact Form Submission: ${subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${to}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div><strong>Message:</strong></div>
            <div>${html}</div>
          `,
        });
      } catch (adminEmailError) {
        console.error("Failed to send admin notification:", adminEmailError);
        // Don't fail the whole request if admin notification fails
      }
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);