import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liberchat.app',
  appName: 'Liberchat',
  webDir: 'dist',
  server: {
    url: 'https://liberchat.fr',
    cleartext: true
  }
};

export default config;
