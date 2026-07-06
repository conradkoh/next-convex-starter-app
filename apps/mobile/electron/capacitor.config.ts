import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.workspace.mobile',
  appName: 'Mobile',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
