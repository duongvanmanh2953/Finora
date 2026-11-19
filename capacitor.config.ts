import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'Tich.San_2953',
  appName: 'Tích Sản - Quản lý tài chính cá nhân',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '1012760872089-ed3a19tlm8k2dhd3jr40mi0vpcekvb6d.apps.googleusercontent.com',
      clientId: '1012760872089-ed3a19tlm8k2dhd3jr40mi0vpcekvb6d.apps.googleusercontent.com',
      androidClientId: '1012760872089-ed3a19tlm8k2dhd3jr40mi0vpcekvb6d.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    }
  }
};

export default config;
