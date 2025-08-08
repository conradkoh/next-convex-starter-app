# Expo Mobile App Setup

This mobile app was set up using the latest `create-expo-app` with the following configuration:

## Configuration Details

- **Package Name**: `@workspace/mobile`
- **Expo SDK Version**: 53.0.20 (latest stable)
- **React Native Version**: 0.79.5
- **Template**: Default template with Expo Router
- **Package Manager**: pnpm (configured for monorepo)

## Available Scripts

From the root of the monorepo:

```bash
# Start the Expo development server
pnpm mobile

# Start for iOS
pnpm mobile:ios

# Start for Android
pnpm mobile:android

# Start for web
pnpm mobile:web
```

From the mobile app directory (`apps/mobile`):

```bash
# Start the Expo development server
pnpm start

# Start for specific platforms
pnpm ios
pnpm android
pnpm web

# Reset project (removes generated files)
pnpm reset-project

# Lint the code
pnpm lint
```

## Features Included

- **Expo Router**: File-based routing system
- **TypeScript**: Full TypeScript support
- **Cross-platform**: iOS, Android, and Web support
- **Modern React Native**: Uses React Native 0.79.5
- **Convex Integration**: Real-time backend with type safety
- **Development Tools**: ESLint configuration included

## Convex Backend Integration

The mobile app is connected to the same Convex backend as the web app:

- **Shared Backend**: Uses `@workspace/backend` package
- **Shared Frontend Code**: Reuses components and hooks from `@workspace/webapp`
- **Real-time Data**: Automatic updates via Convex subscriptions
- **Type Safety**: Full TypeScript support across frontend and backend
- **App Version Display**: Shows backend version on the home screen
- **Reduced Duplication**: Imports AppInfoProvider and useAppInfo from webapp

### Code Sharing Strategy

The mobile app reduces code duplication by importing shared components from the webapp:

- **AppInfoProvider**: Context provider for app information (shared)
- **useAppInfo Hook**: Custom hook for accessing app info (shared)
- **ConvexClientProvider**: Mobile-specific implementation for Expo environment
- **Types**: All types are shared between mobile and web apps

### Environment Configuration

The app uses `EXPO_PUBLIC_CONVEX_URL` for backend connection. This is configured in:

- `.env.local` for development
- `app.config.js` for app configuration

## Development Environment

The app supports:

- iOS 15.1+
- Android API level 35+
- Web browsers with modern JavaScript support

## Available Commands

Additional development commands:

```bash
# Type checking
pnpm typecheck

# From root (includes mobile app)
pnpm typecheck
```

## Next Steps

1. Install the Expo Go app on your mobile device for easy testing
2. Run `pnpm mobile` to start the development server
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)
4. Check the home screen for the app version from Convex backend
5. Start building your mobile app with real-time data!

## Monorepo Integration

The mobile app is fully integrated into the pnpm workspace and follows the same conventions as other packages in this monorepo.
