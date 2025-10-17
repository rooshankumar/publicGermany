import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.publicgermany.app',
  appName: 'publicGermany',
  webDir: 'dist',
  server: {
    url: 'https://publicgermany.vercel.app',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: true,
      spinnerColor: '#0066cc',
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'large',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#0066cc'
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
