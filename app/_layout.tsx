import '@/global.css';

import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold, Montserrat_700Bold_Italic } from '@expo-google-fonts/montserrat';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useSegments, useRouter } from 'expo-router';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuthGroup && !inOnboarding) {
      router.replace('/(auth)/sign-in');
    } else if (user && inAuthGroup) {
      // Vérifier si le profil est complet (onboarding terminé)
      const hasCompletedOnboarding = user.profile?.favoriteTeamCode || user.profile?.favoriteDriverCode;
      
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, isInitialized, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [loaded, error] = useFonts({
    Inter: Inter_400Regular,
    Inter_Medium: Inter_500Medium,
    Inter_SemiBold: Inter_600SemiBold,
    Inter_Bold: Inter_700Bold,
    Montserrat: Montserrat_400Regular,
    Montserrat_Medium: Montserrat_500Medium,
    Montserrat_SemiBold: Montserrat_600SemiBold,
    Montserrat_Bold: Montserrat_700Bold,
    Montserrat_Bold_Italic: Montserrat_700Bold_Italic,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <AuthProvider>
        <SocketProvider>
          <AuthGuard>
            <StatusBar style="auto" />
            <Stack>
              <Stack.Screen name="(tabs)"    options={{ headerShown: false }} />
              <Stack.Screen name="(auth)"    options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
              <Stack.Screen name="messages"          options={{ headerShown: false }} />
              <Stack.Screen name="messages/[userId]" options={{ headerShown: false }} />
              <Stack.Screen name="user"              options={{ headerShown: false }} />
              <Stack.Screen name="user/[id]"         options={{ headerShown: false }} />
              <Stack.Screen name="search"            options={{ headerShown: false }} />
            </Stack>
            <PortalHost />
          </AuthGuard>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
