import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const useNativeCamera = () => {
  const [isLoading, setIsLoading] = useState(false);

  const takePicture = async (): Promise<string | null> => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web camera for browser
      return null;
    }

    try {
      setIsLoading(true);
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGallery = async (): Promise<string | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      setIsLoading(true);
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error('Error picking from gallery:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    takePicture,
    pickFromGallery,
    isLoading,
    isNative: Capacitor.isNativePlatform()
  };
};