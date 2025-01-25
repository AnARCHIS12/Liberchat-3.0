import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liberchat.app',
  appName: 'Liberchat',
  webDir: 'dist',
  server: {
    url: 'https://liberchat-3-0-1.onrender.com',
    cleartext: true,
    allowNavigation: ['liberchat-3-0-1.onrender.com'],
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
    webViewSuspended: false
  }
};

export default config;
