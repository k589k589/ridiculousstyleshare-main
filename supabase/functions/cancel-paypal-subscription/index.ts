import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get active subscription
    const { data: subscriptions, error: subError } = await supabase
      .from('vip_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      throw new Error('No active subscription found');
    }

    const subscription = subscriptions[0];

    if (!subscription.paypal_subscription_id) {
      throw new Error('No PayPal subscription ID found');
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Cancel subscription with PayPal
    const cancelResponse = await fetch(
      `${PAYPAL_API}/v1/billing/subscriptions/${subscription.paypal_subscription_id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Customer requested cancellation'
        }),
      }
    );

    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text();
      console.error('PayPal cancel error:', errorText);

      // Check if subscription is already cancelled or invalid
      // PayPal returns 422 if subscription is already cancelled/suspended/expired
      // PayPal returns 404 if subscription doesn't exist
      if (cancelResponse.status === 422 || cancelResponse.status === 404) {
        console.log('Subscription already cancelled, not found, or invalid on PayPal. Updating local status...');
        // Don't throw an error - just continue to update our database
      } else {
        throw new Error(`Failed to cancel subscription with PayPal: ${errorText}`);
      }
    } else {
      console.log('Subscription cancelled successfully on PayPal');
    }

    // Update subscription status in database
    const { error: updateError } = await supabase
      .from('vip_subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update subscription status');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription cancelled successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to cancel subscription'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
