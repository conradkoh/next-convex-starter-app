# Convex Mobile Setup Troubleshooting

## Common Issues and Solutions

### 1. "CONVEX_URL is not defined" Error

**Problem**: The app can't find the Convex URL configuration.

**Solutions**:

- Ensure `.env.local` exists in `apps/mobile/` with `EXPO_PUBLIC_CONVEX_URL`
- Restart the Expo development server after adding environment variables
- Check that `app.config.js` properly exposes the environment variable

### 2. "useAppInfo must be used within an AppInfoProvider" Error

**Problem**: Components are trying to use the app info context outside of the provider.

**Solution**: Ensure `AppInfoProvider` wraps your component tree in `app/_layout.tsx`

### 3. Network/Connection Issues

**Problem**: Mobile app can't connect to Convex backend.

**Solutions**:

- Ensure your development machine and mobile device are on the same network
- Check that the Convex URL is accessible from your mobile device
- Verify that Convex backend is running (check the webapp works first)

### 4. TypeScript Errors

**Problem**: Import or type errors related to Convex.

**Solutions**:

- Run `pnpm install` to ensure all dependencies are installed
- Run `pnpm typecheck` to see specific errors
- Ensure `@workspace/backend` package is properly linked

## Development Tips

1. **Test webapp first**: Always ensure the webapp works with Convex before testing mobile
2. **Use console logs**: Add `console.log(appInfo)` in your components to debug data flow
3. **Check Expo console**: Monitor the Expo development console for detailed error messages
4. **Network debugging**: Use tools like `adb logcat` (Android) or Xcode console (iOS) for network issues
5. **Shared code updates**: Changes to AppInfoProvider in webapp automatically affect mobile app

## File Structure Reference (After Code Sharing)

```
apps/mobile/
├── providers/
│   ├── ConvexClientProvider.tsx  # Mobile-specific Convex client setup
│   └── index.ts                  # Exports (imports shared code from webapp)
├── hooks/
│   └── index.ts                 # Exports (imports shared hooks from webapp)
├── app/
│   └── _layout.tsx              # Root layout with providers
├── .env.local                   # Environment variables
└── app.config.js               # Expo configuration

Shared from @workspace/webapp:
├── src/modules/app/
│   ├── AppInfoProvider.tsx      # Shared app info context
│   └── useAppInfo.ts           # Shared app info hook
```

### Dependencies

- `@workspace/backend` - Shared backend API and types
- `@workspace/webapp` - Shared frontend components and hooks
- `convex` & `convex-helpers` - Convex client libraries
