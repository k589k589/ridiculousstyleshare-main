import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const useNativeShare = () => {
  const shareOutfit = async (title: string, text: string, url?: string) => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to Web Share API
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return true;
        } catch (error) {
          console.error('Error sharing via Web Share API:', error);
          return false;
        }
      }
      return false;
    }

    try {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: '分享穿搭'
      });
      return true;
    } catch (error) {
      console.error('Error sharing via native share:', error);
      return false;
    }
  };

  return {
    shareOutfit,
    canShare: Capacitor.isNativePlatform() || !!navigator.share
  };
};