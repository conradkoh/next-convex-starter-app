import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppVersion } from '@/hooks';

export default function TabTwoScreen() {
  const appVersion = useAppVersion();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <View style={styles.section}>
          <ThemedText type="title">About this app</ThemedText>
          <ThemedText>Convex + Expo mobile client for the Next Convex Starter App.</ThemedText>
          <ThemedText>Version: {appVersion ?? 'Loading...'}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Tech stack</ThemedText>
          <ThemedText>- Expo Router</ThemedText>
          <ThemedText>- Convex (shared backend)</ThemedText>
          <ThemedText>- React Native</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Project links</ThemedText>
          <ThemedText>- Web app is in apps/webapp</ThemedText>
          <ThemedText>- Backend is in services/backend</ThemedText>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  section: {
    gap: 8,
  },
});
