import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { setupNotificationHandler, requestPermissions } from '@/lib/notifications';
import { ThemeProvider, useTheme } from '@/lib/theme';

export const unstable_settings = { anchor: '(tabs)' };

function RootStack() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    setupNotificationHandler();
    requestPermissions();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="notes"     options={{ title: 'Notes',     headerBackTitle: 'Back' }} />
        <Stack.Screen name="pomodoro"  options={{ title: 'Pomodoro',  headerBackTitle: 'Back' }} />
        <Stack.Screen name="analytics" options={{ title: 'Analytics', headerBackTitle: 'Back' }} />
        <Stack.Screen name="calendar"  options={{ title: 'Calendar',  headerBackTitle: 'Back' }} />
        <Stack.Screen name="coach"     options={{ title: 'Coach',     headerBackTitle: 'Back' }} />
        <Stack.Screen name="modal"     options={{ presentation: 'modal', title: '' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
