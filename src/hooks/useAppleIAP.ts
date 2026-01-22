import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Product ID - must match App Store Connect
const VIP_PRODUCT_ID = 'vip_monthly_subscription';

// Type declarations for cordova-plugin-purchase
declare global {
    interface Window {
        CdvPurchase?: {
            store: {
                register: (products: Array<{ id: string; type: string; platform: string }>) => void;
                initialize: (platforms?: string[]) => Promise<void>;
                update: () => Promise<void>;
                get: (productId: string) => any;
                restorePurchases: () => Promise<void>;
                refresh: () => Promise<void>;
                error: (cb: (err: any) => void) => void;
                appStoreReceipt?: string;
                when: () => {
                    approved: (cb: (transaction: any) => void) => any;
                    verified: (cb: (receipt: any) => void) => any;
                    finished: (cb: (transaction: any) => void) => any;
                    productUpdated: (cb: (product: any) => void) => any;
                };
            };
            ProductType: {
                PAID_SUBSCRIPTION: string;
            };
            Platform: {
                APPLE_APPSTORE: string;
            };
        };
    }
}

interface IAPProduct {
    id: string;
    title: string;
    description: string;
    price: string;
    canPurchase: boolean;
}

interface UseAppleIAPReturn {
    isAvailable: boolean;
    isLoading: boolean;
    product: IAPProduct | null;
    error: string | null;
    purchase: () => Promise<{ success: boolean; error?: string }>;
    restore: () => Promise<boolean>;
}

// Callbacks to resolve/reject the purchase promise
type PurchaseResolve = (result: { success: boolean; error?: string }) => void;

export const useAppleIAP = (): UseAppleIAPReturn => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [product, setProduct] = useState<IAPProduct | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Ref to hold the purchase promise resolver
    const purchaseResolverRef = useRef<PurchaseResolve | null>(null);

    // Initialize the store
    useEffect(() => {
        const initializeStore = async () => {
            // Only run on iOS
            if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
                setIsLoading(false);
                return;
            }

            // Wait for device ready and plugin to be available
            const waitForPlugin = () => {
                return new Promise<boolean>((resolve) => {
                    let attempts = 0;
                    const check = () => {
                        if (window.CdvPurchase?.store) {
                            resolve(true);
                        } else if (attempts < 20) {
                            attempts++;
                            setTimeout(check, 250);
                        } else {
                            resolve(false);
                        }
                    };
                    check();
                });
            };

            try {
                const pluginReady = await waitForPlugin();

                if (!pluginReady || !window.CdvPurchase) {
                    console.log('IAP plugin not available');
                    setIsLoading(false);
                    return;
                }

                const { store, ProductType, Platform } = window.CdvPurchase;

                // Register products
                store.register([{
                    id: VIP_PRODUCT_ID,
                    type: ProductType.PAID_SUBSCRIPTION,
                    platform: Platform.APPLE_APPSTORE
                }]);

                // Set up event handlers
                store.when()
                    .productUpdated((p: any) => {
                        console.log('Product updated:', p);
                        if (p.id === VIP_PRODUCT_ID) {
                            setProduct({
                                id: p.id,
                                title: p.title || 'VIP Membership',
                                description: p.description || 'Unlimited try-ons',
                                price: p.pricing?.price || '$5.00',
                                canPurchase: p.canPurchase || false
                            });
                        }
                    })
                    .approved(async (transaction: any) => {
                        console.log('Transaction approved:', transaction);
                        // Verify with our backend
                        try {
                            await verifyReceipt(transaction);
                            transaction.verify();
                        } catch (err: any) {
                            console.error('Receipt verification failed:', err);
                            const msg = `Verification failed: ${err.message}`;
                            setError(msg);
                            // Resolve the purchase promise with failure
                            if (purchaseResolverRef.current) {
                                purchaseResolverRef.current({ success: false, error: msg });
                                purchaseResolverRef.current = null;
                            }
                        }
                    })
                    .verified((receipt: any) => {
                        console.log('Receipt verified:', receipt);
                        receipt.finish();
                    })
                    .finished((transaction: any) => {
                        console.log('Transaction finished:', transaction);
                        // Resolve the purchase promise with success
                        if (purchaseResolverRef.current) {
                            purchaseResolverRef.current({ success: true });
                            purchaseResolverRef.current = null;
                        }
                    });

                // Initialize and update
                try {
                    // Global error handler - check if method exists first
                    if (typeof store.error === 'function') {
                        store.error((err: any) => {
                            console.error('Store error:', err);
                            if (purchaseResolverRef.current) {
                                purchaseResolverRef.current({
                                    success: false,
                                    error: `Store Error: ${err.message} (Code: ${err.code})`
                                });
                                purchaseResolverRef.current = null;
                            }
                        });
                    }

                    await store.initialize([Platform.APPLE_APPSTORE]);
                    await store.update();

                    setIsAvailable(true);
                } catch (storeError) {
                    console.error('Store initialization exception:', storeError);
                    // Don't crash app, just log error
                }
            } catch (err) {
                console.error('IAP initialization error:', err);
                setError('Failed to initialize purchases');
                // Ensure we don't block loading state forever
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        };

        // Don't run initialization immediately to allow app shell to load first
        const timer = setTimeout(() => {
            initializeStore().catch(e => console.error('Safe init crash:', e));
        }, 1000); // 1 second delay

        return () => clearTimeout(timer);
    }, []);

    // Verify receipt with our backend
    const verifyReceipt = async (transaction: any) => {
        console.log('=== VERIFY RECEIPT DEBUG START ===');
        console.log('Transaction object:', JSON.stringify(transaction, null, 2));

        // Debug globals
        console.log('window.CdvPurchase exists:', !!window.CdvPurchase);
        // @ts-ignore
        console.log('window.CdvPurchase.store exists:', !!window.CdvPurchase?.store);

        const session = await supabase.auth.getSession();
        if (!session.data.session) {
            throw new Error('Not authenticated');
        }

        // Try different receipt data properties used by cordova-plugin-purchase
        let receiptData = transaction.appStoreReceipt
            || transaction.transactionReceipt
            || transaction.receipt
            || transaction.nativeData?.appStoreReceipt
            || transaction.nativeData?.transactionReceipt;

        console.log('Initial extracted receiptData:', receiptData ? 'FOUND' : 'NULL');

        // Fallback: Try to get the application receipt from the store global
        if (!receiptData) {
            console.log('Receipt missing from transaction. Checking global store...');
            if (window.CdvPurchase?.store) {
                // @ts-ignore
                const globalReceipt = window.CdvPurchase.store.appStoreReceipt;
                console.log('Global store.appStoreReceipt:', globalReceipt ? 'FOUND' : 'NULL');
                if (globalReceipt) receiptData = globalReceipt;
            } else {
                console.warn('window.CdvPurchase.store is NOT available for fallback.');
            }
        }

        // FORCE REFRESH if still missing
        if (!receiptData) {
            console.log('Receipt still missing. ATTEMPTING FORCE REFRESH...');
            if (window.CdvPurchase?.store) {
                try {
                    // @ts-ignore
                    await window.CdvPurchase.store.refresh();
                    console.log('Refresh call completed.');

                    // @ts-ignore
                    const refreshedReceipt = window.CdvPurchase.store.appStoreReceipt;
                    console.log('Receipt after refresh:', refreshedReceipt ? 'FOUND' : 'STILL MISSING');
                    if (refreshedReceipt) receiptData = refreshedReceipt;
                } catch (e) {
                    console.error('Store refresh failed:', e);
                }
            } else {
                console.error('Cannot refresh: store global is missing.');
            }
        }

        console.log('Final receiptData to send:', receiptData ? `${receiptData.substring(0, 20)}...` : 'NULL');

        if (!receiptData) {
            console.error('FATAL: Could not extract receipt data from transaction or store');
            throw new Error('No receipt data available - Verified');
        }

        const transactionId = transaction.id || transaction.transactionId;
        const originalTransactionId = transaction.originalId
            || transaction.originalTransactionId
            || transaction.id
            || transaction.transactionId;

        console.log('Sending to verify-apple-receipt:', {
            hasReceiptData: !!receiptData,
            transactionId,
            originalTransactionId
        });

        const { data, error } = await supabase.functions.invoke('verify-apple-receipt', {
            body: {
                receiptData,
                transactionId,
                originalTransactionId
            },
            headers: {
                Authorization: `Bearer ${session.data.session.access_token}`
            }
        });

        console.log('verify-apple-receipt response:', { data, error });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Verification failed');

        return data;
    };

    // Purchase the subscription - returns a promise that resolves when the transaction finishes
    const purchase = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        console.log('=== IAP PURCHASE DEBUG START ===');
        console.log('isAvailable:', isAvailable);
        console.log('product state:', product);

        // Double check availability
        if (!window.CdvPurchase?.store) {
            console.error('Purchase failed: Store not initialized');
            console.log('window.CdvPurchase:', window.CdvPurchase);
            const msg = 'Store not initialized. Please restart the app.';
            setError(msg);
            return { success: false, error: msg };
        }

        try {
            setError(null);
            const store = window.CdvPurchase.store;
            const p = store.get(VIP_PRODUCT_ID);

            console.log('Product from store:', p);
            console.log('Product ID being looked up:', VIP_PRODUCT_ID);

            if (!p) {
                console.error(`Purchase failed: Product ${VIP_PRODUCT_ID} not found in store`);
                console.log('Available products: check store manually');
                const msg = `Product "${VIP_PRODUCT_ID}" not found. Please check App Store Connect configuration.`;
                setError(msg);
                return { success: false, error: msg };
            }

            // Removed p.owned check to ensuring purchase flow always triggers
            // Apple will handle "already purchased" scenarios in the dialog


            if (!p.canPurchase) {
                console.error(`Purchase failed: Product ${VIP_PRODUCT_ID} is not purchasable`);
                // If checking 'canPurchase' is too strict for sandbox, we might warn but proceed?
                // But generally safe to fail.
                const msg = `Product not available for purchase. State: ${p.state || 'unknown'}`;
                setError(msg);
                return { success: false, error: msg };
            }

            // Initiate purchase
            const offer = p.getOffer?.();
            console.log('Offer:', offer);

            if (!offer) {
                console.error(`Purchase failed: No offer found for product ${VIP_PRODUCT_ID}`);
                const msg = 'No valid subscription offer found. Check App Store Connect pricing.';
                setError(msg);
                return { success: false, error: msg };
            }

            console.log('=== INITIATING PURCHASE ===');
            console.log('Offer details:', {
                id: offer.id,
                pricingPhases: offer.pricingPhases
            });

            // Create a promise that will be resolved by the event handlers
            const purchasePromise = new Promise<{ success: boolean; error?: string }>((resolve) => {
                purchaseResolverRef.current = resolve;

                // Set a timeout to handle cancellation/abandonment (120 seconds to allow for receipt refresh/signin)
                setTimeout(() => {
                    if (purchaseResolverRef.current) {
                        console.log('Purchase timed out after 120 seconds');
                        purchaseResolverRef.current({ success: false, error: 'Purchase timed out. Please try again.' });
                        purchaseResolverRef.current = null;
                    }
                }, 120000);
            });

            // Initiate the purchase - this opens Apple's purchase dialog
            console.log('Calling offer.order()...');
            const orderResult = await offer.order();
            console.log('offer.order() returned:', orderResult);

            // Check if order was successful
            // Note: CdvPurchase order() returns undefined on success (usually), or an error object? 
            // The type definition says Promise<IError | undefined>.
            if (orderResult && typeof orderResult === 'object' && 'isError' in orderResult) { // Safe check
                console.error('Order returned error:', orderResult);
                purchaseResolverRef.current = null;
                return { success: false, error: (orderResult as any).message || 'Order failed to start' };
            }

            console.log('Waiting for transaction to complete...');

            // Wait for the transaction to complete (or fail/cancel)
            return await purchasePromise;

        } catch (err: any) {
            console.error('Purchase error exception:', err);
            const msg = err.message || 'Purchase failed unexpectedly';
            setError(msg);
            // Clear any pending resolver
            purchaseResolverRef.current = null;
            return { success: false, error: msg };
        }
    }, [isAvailable, product]);

    // Restore purchases
    const restore = useCallback(async (): Promise<boolean> => {
        if (!isAvailable || !window.CdvPurchase?.store) {
            setError('Purchases not available');
            return false;
        }

        try {
            setError(null);
            await window.CdvPurchase.store.restorePurchases();
            return true;
        } catch (err: any) {
            console.error('Restore error:', err);
            setError(err.message || 'Restore failed');
            return false;
        }
    }, [isAvailable]);

    return {
        isAvailable,
        isLoading,
        product,
        error,
        purchase,
        restore
    };
};
