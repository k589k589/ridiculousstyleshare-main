import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYPAL_API = Deno.env.get('PAYPAL_MODE') === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  
  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Creating PayPal subscription for user:', user.id);

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from('vip_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      return new Response(
        JSON.stringify({ error: 'You already have an active subscription' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get PayPal mode and plan ID from environment
    const mode = Deno.env.get('PAYPAL_MODE') === 'live' ? 'live' : 'sandbox';
    const planId = Deno.env.get('PAYPAL_PLAN_ID');
    if (!planId) {
      throw new Error('PAYPAL_PLAN_ID not configured. Please set it in Supabase Edge Function secrets.');
    }

    // Validate plan ID format early to provide a clear error
    const planIdPattern = /^P-[A-Za-z0-9]+$/;
    if (!planIdPattern.test(planId)) {
      console.error('Invalid PAYPAL_PLAN_ID format:', planId);
      return new Response(
        JSON.stringify({
          error: 'Invalid PAYPAL_PLAN_ID format',
          hint: 'Create a Billing Plan in PayPal and use the exact generated Plan ID (e.g., P-xxxxxxxxxxxx).',
          received: planId,
          mode,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Using PayPal Plan ID: ${planId} (mode: ${mode})`);

    const requestBody = {
      plan_id: planId,
      subscriber: {
        name: {
          given_name: user.email?.split('@')[0] || 'User',
        },
      },
      application_context: {
        brand_name: 'StyleShare VIP',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${req.headers.get('origin')}/profile?subscription=success`,
        cancel_url: `${req.headers.get('origin')}/profile?subscription=cancelled`,
      },
      custom_id: user.id,
    };

    console.log('Creating PayPal subscription with request:', JSON.stringify(requestBody, null, 2));

    // Create subscription
    const subscriptionResponse = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const subscriptionData = await subscriptionResponse.json();

    if (!subscriptionResponse.ok) {
      console.error('PayPal subscription error:', subscriptionData);
      throw new Error(subscriptionData.message || 'Failed to create subscription');
    }

    // Store subscription in database
    await supabase
      .from('vip_subscriptions')
      .insert({
        user_id: user.id,
        paypal_subscription_id: subscriptionData.id,
        status: 'pending',
        plan_id: planId,
      });

    // Find approval URL
    const approvalUrl = subscriptionData.links.find((link: any) => link.rel === 'approve')?.href;

    console.log('PayPal subscription created:', subscriptionData.id);

    return new Response(
      JSON.stringify({ 
        subscriptionId: subscriptionData.id,
        approvalUrl 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating PayPal subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});