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

async function verifyWebhook(req: Request, body: string) {
  const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
  if (!webhookId) {
    console.warn('PAYPAL_WEBHOOK_ID not set, skipping verification');
    return true; // Skip verification in development
  }

  const accessToken = await getPayPalAccessToken();
  
  const verifyResponse = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: req.headers.get('paypal-transmission-id'),
      transmission_time: req.headers.get('paypal-transmission-time'),
      cert_url: req.headers.get('paypal-cert-url'),
      auth_algo: req.headers.get('paypal-auth-algo'),
      transmission_sig: req.headers.get('paypal-transmission-sig'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });

  const verifyData = await verifyResponse.json();
  return verifyData.verification_status === 'SUCCESS';
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    
    // Verify webhook signature
    const isValid = await verifyWebhook(req, body);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('PayPal webhook event:', event.event_type);

    const subscriptionId = event.resource?.id;
    const userId = event.resource?.custom_id;

    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        // Subscription activated - mark as active
        await supabase
          .from('vip_subscriptions')
          .update({
            status: 'active',
            start_date: new Date().toISOString(),
            next_billing_date: event.resource.billing_info?.next_billing_time,
          })
          .eq('paypal_subscription_id', subscriptionId);
        
        console.log(`Subscription ${subscriptionId} activated for user ${userId}`);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        // Subscription ended - mark as inactive
        await supabase
          .from('vip_subscriptions')
          .update({
            status: 'cancelled',
          })
          .eq('paypal_subscription_id', subscriptionId);
        
        console.log(`Subscription ${subscriptionId} cancelled/suspended/expired`);
        break;
      }

      case 'BILLING.SUBSCRIPTION.UPDATED': {
        // Subscription updated
        await supabase
          .from('vip_subscriptions')
          .update({
            next_billing_date: event.resource.billing_info?.next_billing_time,
          })
          .eq('paypal_subscription_id', subscriptionId);
        
        console.log(`Subscription ${subscriptionId} updated`);
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        // Payment successful - update billing date
        const { data: subscription } = await supabase
          .from('vip_subscriptions')
          .select('*')
          .eq('paypal_subscription_id', event.resource.billing_agreement_id)
          .single();

        if (subscription) {
          await supabase
            .from('vip_subscriptions')
            .update({
              status: 'active',
              next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', subscription.id);
        }
        
        console.log(`Payment completed for subscription ${event.resource.billing_agreement_id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});