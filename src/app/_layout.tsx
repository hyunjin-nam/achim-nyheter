import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { preloadLookupCache } from '@/lib/lookup';
import { ReadProvider } from '@/lib/read';
import { SettingsProvider } from '@/lib/settings';
import { usePalette } from '@/lib/use-palette';
import { VocabProvider } from '@/lib/vocab';

export default function RootLayout() {
  const c = usePalette();
  useEffect(() => {
    preloadLookupCache();
  }, []);
  const [loaded, error] = useFonts({
    'Pretendard-Regular': require('pretendard/dist/public/static/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('pretendard/dist/public/static/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('pretendard/dist/public/static/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('pretendard/dist/public/static/Pretendard-Bold.otf'),
  });

  // Wait for the font so text never flashes in another typeface. If it fails, carry on with the system font.
  if (!loaded && !error) return null;

  return (
    <SettingsProvider>
      <VocabProvider>
        <ReadProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
            <Stack.Screen name="vocab" options={{ presentation: 'modal' }} />
            <Stack.Screen name="archive" options={{ presentation: 'modal' }} />
          </Stack>
        </ReadProvider>
      </VocabProvider>
    </SettingsProvider>
  );
}
