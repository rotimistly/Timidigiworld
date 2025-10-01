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

  console.log("Creating Paystack subaccount");
  
  try {
    const { userId, bankDetails } = await req.json();
    
    if (!userId || !bankDetails) {
      throw new Error("User ID and bank details are required");
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.log("PAYSTACK_SECRET_KEY not configured - skipping subaccount creation");
      return new Response(JSON.stringify({
        success: true,
        message: "Paystack not configured, bank details saved without subaccount creation"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get user profile for business name and email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, business_name")
      .eq("user_id", userId)
      .single();

    // Get user email from auth
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = user.user?.email;

    if (!userEmail) {
      throw new Error("User email not found");
    }

    const businessName = profile?.business_name || profile?.full_name || `Business-${userId.slice(0, 8)}`;

    console.log("Creating Paystack subaccount for:", {
      business_name: businessName,
      bank_code: bankDetails.bank_code,
      account_number: bankDetails.account_number
    });

    // First, verify the account to get the account name
    const verifyResponse = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${bankDetails.account_number}&bank_code=${bankDetails.bank_code}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log("Paystack account verification response:", verifyData);

    if (!verifyData.status) {
      throw new Error(verifyData.message || "Failed to verify bank account");
    }

    const accountName = verifyData.data.account_name;
    console.log("Verified account name:", accountName);

    // Update profile with verified account details first
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        bank_name: bankDetails.bank_name,
        account_number: bankDetails.account_number,
        account_name: accountName,
        bank_code: bankDetails.bank_code,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.error("Failed to update profile with bank details:", profileUpdateError);
      throw profileUpdateError;
    }

    // Create subaccount with Paystack
    const subaccountResponse = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: businessName,
        settlement_bank: bankDetails.bank_code,
        account_number: bankDetails.account_number,
        percentage_charge: 75, // Seller gets 75%
        description: `Subaccount for ${businessName}`,
        primary_contact_email: userEmail,
        primary_contact_name: profile?.full_name || businessName,
        primary_contact_phone: bankDetails.phone || "",
        metadata: {
          user_id: userId,
          created_at: new Date().toISOString()
        }
      }),
    });

    const subaccountData = await subaccountResponse.json();
    console.log("Paystack subaccount response:", subaccountData);
    
    if (!subaccountData.status) {
      console.error("Paystack subaccount creation failed:", subaccountData);
      throw new Error(subaccountData.message || "Failed to create Paystack subaccount");
    }

    // Update user profile with subaccount code
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        paystack_subaccount_code: subaccountData.data.subaccount_code,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Failed to update profile with subaccount code:", updateError);
      throw updateError;
    }

    console.log("Paystack subaccount created successfully:", subaccountData.data.subaccount_code);

    return new Response(JSON.stringify({
      success: true,
      subaccount_code: subaccountData.data.subaccount_code,
      account_name: accountName,
      message: "Bank account verified and Paystack subaccount created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error creating Paystack subaccount:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});