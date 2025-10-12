import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ed7192266d3e418fb8f92bcd173c43d9',
  appName: 'my-germany-path',
  webDir: 'dist',
  server: {
    url: 'https://ed719226-6d3e-418f-b8f9-2bcd173c43d9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#D00000',
      showSpinner: false
    }
  }
};

export default config;
