import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f799ff6aac7b4f72947dd845f407d909',
  appName: 'TaxWise Nigeria',
  webDir: 'dist',
  server: {
    url: 'https://f799ff6a-ac7b-4f72-947d-d845f407d909.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
  },
};

export default config;
