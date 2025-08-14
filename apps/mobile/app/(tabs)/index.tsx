import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppInfo } from '@/hooks';

/**
 * Home screen component that displays the app title and version.
 */
export default function HomeScreen() {
  const { appInfo, isLoading, error } = useAppInfo();

  // Debug log to see what we're getting
  console.log('App info:', { appInfo, isLoading, error });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.main}>
        <ThemedText type="title" style={styles.title}>
          Convex + Expo Starter App
        </ThemedText>
      </View>

      <View style={styles.footer}>
        {isLoading ? (
          <ThemedText style={styles.versionText}>Loading app version...</ThemedText>
        ) : error ? (
          <ThemedText style={styles.versionText}>Error: {error.message}</ThemedText>
        ) : appInfo ? (
          <ThemedText style={styles.versionText}>App Version: {appInfo.version}</ThemedText>
        ) : (
          <ThemedText style={styles.versionText}>No app info available</ThemedText>
        )}

        <ThemedText style={styles.debugText}>
          Debug - Loading: {isLoading ? 'Yes' : 'No'}, Error: {error ? 'Yes' : 'No'}, AppInfo:{' '}
          {appInfo ? 'Yes' : 'No'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 40,
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    opacity: 0.6,
    fontWeight: '400',
  },
  debugText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 10,
  },
});
