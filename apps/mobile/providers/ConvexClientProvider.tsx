import { ConvexProvider, ConvexReactClient } from 'convex/react';
import Constants from 'expo-constants';
import type { ReactNode } from 'react';

/**
 * Gets the Convex URL from environment configuration.
 * In Expo, we use expo-constants to access environment variables.
 */
function _getConvexUrl(): string {
  // Try to get from expo-constants first (for production builds)
  const convexUrl = Constants.expoConfig?.extra?.convexUrl;

  if (convexUrl) {
    return convexUrl;
  }

  // For development, you can also use process.env
  if (process.env.EXPO_PUBLIC_CONVEX_URL) {
    return process.env.EXPO_PUBLIC_CONVEX_URL;
  }

  throw new Error(
    'CONVEX_URL is not defined. Please set EXPO_PUBLIC_CONVEX_URL in your environment or configure it in app.config.js'
  );
}

/**
 * Props for the ConvexClientProvider component.
 */
export interface ConvexClientProviderProps {
  children: ReactNode;
}

// Initialize the Convex client
const convexUrl = _getConvexUrl();
const convex = new ConvexReactClient(convexUrl);

/**
 * Convex Client Provider component that provides Convex client to the mobile app.
 * Handles environment configuration for React Native/Expo environment.
 */
export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
