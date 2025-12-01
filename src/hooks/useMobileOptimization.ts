import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Check if running on mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(mobile || window.innerWidth < 768);
    };

    // Check if running as native app
    const checkNative = () => {
      setIsNative(Capacitor.isNativePlatform());
    };

    // Update screen size
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    checkMobile();
    checkNative();
    updateScreenSize();

    // Add event listeners
    window.addEventListener('resize', () => {
      checkMobile();
      updateScreenSize();
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', updateScreenSize);
    };
  }, []);

  const getOptimalImageSize = () => {
    if (isMobile) {
      return {
        maxWidth: screenSize.width - 32, // Account for padding
        maxHeight: Math.min(400, screenSize.height * 0.4)
      };
    }
    return {
      maxWidth: 600,
      maxHeight: 400
    };
  };

  const getTouchFriendlySize = () => {
    return isMobile ? 'lg' : 'default';
  };

  return {
    isMobile,
    isNative,
    screenSize,
    getOptimalImageSize,
    getTouchFriendlySize
  };
};