import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6c6b5a62d63045ac916473df130fc101',
  appName: 'ridiculousstyleshare',
  webDir: 'dist',
  server: {
    url: 'https://6c6b5a62-d630-45ac-9164-73df130fc101.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;