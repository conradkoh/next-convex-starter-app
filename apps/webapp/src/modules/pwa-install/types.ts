// fallow-ignore-file unused-file
export type InstallPlatform =
  | 'ios-safari'
  | 'ios-other'
  | 'android-chrome'
  | 'android-other'
  | 'desktop-chrome'
  | 'desktop-edge'
  | 'desktop-safari'
  | 'desktop-other'
  | 'already-installed';

// fallow-ignore-next-line unused-type
export interface InstallInstructions {
  platform: InstallPlatform;
  label: string;
  steps: string[];
  note?: string;
}

/** Chromium beforeinstallprompt event (not in lib.dom by default) */
// fallow-ignore-next-line unused-type
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
