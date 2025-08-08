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
- **Development Tools**: ESLint configuration included

## Development Environment

The app supports:

- iOS 15.1+
- Android API level 35+
- Web browsers with modern JavaScript support

## Next Steps

1. Install the Expo Go app on your mobile device for easy testing
2. Run `pnpm mobile` to start the development server
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)
4. Start building your mobile app!

## Monorepo Integration

The mobile app is fully integrated into the pnpm workspace and follows the same conventions as other packages in this monorepo.
