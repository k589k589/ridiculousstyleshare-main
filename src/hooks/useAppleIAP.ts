import { useState, useEffect, useCallback } from 'react';
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
    purchase: () => Promise<boolean>;
    restore: () => Promise<boolean>;
}

export const useAppleIAP = (): UseAppleIAPReturn => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [product, setProduct] = useState<IAPProduct | null>(null);
    const [error, setError] = useState<string | null>(null);

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
                        } catch (err) {
                            console.error('Receipt verification failed:', err);
                            setError('Purchase verification failed');
                        }
                    })
                    .verified((receipt: any) => {
                        console.log('Receipt verified:', receipt);
                        receipt.finish();
                    })
                    .finished((transaction: any) => {
                        console.log('Transaction finished:', transaction);
                    });

                // Initialize and update
                await store.initialize([Platform.APPLE_APPSTORE]);
                await store.update();

                setIsAvailable(true);
            } catch (err) {
                console.error('IAP initialization error:', err);
                setError('Failed to initialize purchases');
            } finally {
                setIsLoading(false);
            }
        };

        initializeStore();
    }, []);

    // Verify receipt with our backend
    const verifyReceipt = async (transaction: any) => {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
            throw new Error('Not authenticated');
        }

        const { data, error } = await supabase.functions.invoke('verify-apple-receipt', {
            body: {
                receiptData: transaction.appStoreReceipt,
                transactionId: transaction.id,
                originalTransactionId: transaction.originalId || transaction.id
            },
            headers: {
                Authorization: `Bearer ${session.data.session.access_token}`
            }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Verification failed');

        return data;
    };

    // Purchase the subscription
    const purchase = useCallback(async (): Promise<boolean> => {
        // Double check availability
        if (!window.CdvPurchase?.store) {
            setError('Store not initialized');
            return false;
        }

        try {
            setError(null);
            const store = window.CdvPurchase.store;
            const p = store.get(VIP_PRODUCT_ID);

            if (!p) {
                setError('Product not found');
                return false;
            }

            // Initiate purchase
            const offer = p.getOffer?.();
            if (offer) {
                await offer.order();
                return true;
            } else {
                setError('No offer available');
                return false;
            }
        } catch (err: any) {
            console.error('Purchase error:', err);
            setError(err.message || 'Purchase failed');
            return false;
        }
    }, [isAvailable]);

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
