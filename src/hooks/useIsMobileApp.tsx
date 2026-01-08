
import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

export const useIsMobileApp = () => {
    const [isMobileApp, setIsMobileApp] = useState(false);

    useEffect(() => {
        // Check if running in a native app (ios or android)
        const isNative = Capacitor.isNativePlatform();
        setIsMobileApp(isNative);

        // Add a class to the body for global styling if needed
        if (isNative) {
            document.body.classList.add('is-mobile-app');
        }
    }, []);

    return isMobileApp;
};
