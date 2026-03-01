import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Apple verification endpoints
const APPLE_VERIFY_RECEIPT_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_RECEIPT_PRODUCTION = 'https://buy.itunes.apple.com/verifyReceipt';

interface AppleReceiptResponse {
    status: number;
    environment?: string;
    receipt?: {
        bundle_id: string;
        in_app: Array<{
            product_id: string;
            transaction_id: string;
            original_transaction_id: string;
            purchase_date_ms: string;
            expires_date_ms?: string;
        }>;
    };
    latest_receipt_info?: Array<{
        product_id: string;
        transaction_id: string;
        original_transaction_id: string;
        purchase_date_ms: string;
        expires_date_ms?: string;
        is_trial_period?: string;
        is_in_intro_offer_period?: string;
    }>;
    pending_renewal_info?: Array<{
        product_id: string;
        auto_renew_status: string;
        expiration_intent?: string;
    }>;
}

async function verifyWithApple(receiptData: string, useSandbox: boolean): Promise<AppleReceiptResponse> {
    const url = useSandbox ? APPLE_VERIFY_RECEIPT_SANDBOX : APPLE_VERIFY_RECEIPT_PRODUCTION;
    const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET') || '';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'receipt-data': receiptData,
            'password': sharedSecret,
            'exclude-old-transactions': true,
        }),
    });

    return await response.json();
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

        const { receiptData, transactionId, originalTransactionId } = await req.json();

        if (!receiptData) {
            throw new Error('Receipt data is required');
        }

        console.log('Verifying Apple receipt for user:', user.id);

        // First try production, if status 21007, retry with sandbox
        let verifyResult = await verifyWithApple(receiptData, false);

        // Status 21007 means receipt is from sandbox
        if (verifyResult.status === 21007) {
            console.log('Receipt is from sandbox, retrying with sandbox URL');
            verifyResult = await verifyWithApple(receiptData, true);
        }

        // Check verification status
        // 0 = valid receipt
        if (verifyResult.status !== 0) {
            console.error('Apple verification failed with status:', verifyResult.status);
            throw new Error(`Apple verification failed with status ${verifyResult.status}`);
        }

        // Get the latest subscription info
        const latestInfo = verifyResult.latest_receipt_info?.[0];

        if (!latestInfo) {
            throw new Error('No subscription info found in receipt');
        }

        // Check if subscription is still valid
        const expiresDateMs = parseInt(latestInfo.expires_date_ms || '0');
        const isActive = expiresDateMs > Date.now();

        console.log('Subscription status:', {
            productId: latestInfo.product_id,
            transactionId: latestInfo.transaction_id,
            originalTransactionId: latestInfo.original_transaction_id,
            expiresDate: new Date(expiresDateMs).toISOString(),
            isActive,
        });

        if (!isActive) {
            return new Response(
                JSON.stringify({ success: false, error: 'Subscription has expired' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Calculate next billing date
        const nextBillingDate = new Date(expiresDateMs).toISOString();

        // Upsert subscription in database
        // Check if already exists by original_transaction_id
        const { data: existingSub } = await supabase
            .from('vip_subscriptions')
            .select('*')
            .eq('apple_original_transaction_id', latestInfo.original_transaction_id)
            .single();

        if (existingSub) {
            // Update existing subscription
            await supabase
                .from('vip_subscriptions')
                .update({
                    status: 'active',
                    apple_transaction_id: latestInfo.transaction_id,
                    next_billing_date: nextBillingDate,
                    subscription_source: 'apple',
                })
                .eq('id', existingSub.id);
        } else {
            // Check if user has any existing active subscription
            const { data: userSub } = await supabase
                .from('vip_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();

            if (userSub) {
                // Update existing user subscription with Apple info
                await supabase
                    .from('vip_subscriptions')
                    .update({
                        apple_transaction_id: latestInfo.transaction_id,
                        apple_original_transaction_id: latestInfo.original_transaction_id,
                        next_billing_date: nextBillingDate,
                        subscription_source: 'apple',
                    })
                    .eq('id', userSub.id);
            } else {
                // Insert new subscription
                await supabase
                    .from('vip_subscriptions')
                    .insert({
                        user_id: user.id,
                        status: 'active',
                        apple_transaction_id: latestInfo.transaction_id,
                        apple_original_transaction_id: latestInfo.original_transaction_id,
                        next_billing_date: nextBillingDate,
                        subscription_source: 'apple',
                    });
            }
        }

        console.log('Apple subscription verified and saved for user:', user.id);

        return new Response(
            JSON.stringify({
                success: true,
                subscription: {
                    transactionId: latestInfo.transaction_id,
                    productId: latestInfo.product_id,
                    expiresDate: nextBillingDate,
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Error verifying Apple receipt:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
