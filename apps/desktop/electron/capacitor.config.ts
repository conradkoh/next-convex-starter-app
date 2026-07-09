import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.workspace.desktop',
  appName: 'Desktop',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
