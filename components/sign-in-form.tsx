import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import * as React from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  type TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Apple, Lock, Mail, RefreshCcw, User } from 'lucide-react-native';

type AuthMode = 'login' | 'register';

const CAR_IMAGE_URI =
  require('@/assets/images/auth/f1-car.png');

const GOOGLE_LOGO_URI = 'https://img.clerk.com/static/google.png?width=160';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

function getRegisterErrorMessage(email: string, username: string, password: string, confirmPassword: string) {
  if (!email.trim()) {
    return 'Email requis.';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Format email invalide (exemple: nom@domaine.com).';
  }
  if (!username.trim()) {
    return 'Pseudo requis.';
  }
  if (username.trim().length < 3) {
    return 'Le pseudo doit contenir au moins 3 caracteres.';
  }
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caracteres.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une majuscule.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une minuscule.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins un chiffre.';
  }
  if (!PASSWORD_SPECIAL_CHAR_REGEX.test(password)) {
    return 'Le mot de passe doit contenir au moins un caractere special (ex: !@#$%^&*).';
  }
  if (password !== confirmPassword) {
    return 'Les mots de passe ne correspondent pas.';
  }

  return null;
}

// Les modules d'auth native (Google / Apple) ne sont PAS inclus dans Expo Go.
// On les charge de maniere optionnelle pour que l'app demarre quand meme dans Expo Go ;
// l'auth sociale ne fonctionne que dans un development build / une build de prod.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let GoogleSignin: any = null;
let statusCodes: any = null;
let AppleAuthentication: any = null;

if (!isExpoGo) {
  try {
    const googleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSigninModule.GoogleSignin;
    statusCodes = googleSigninModule.statusCodes;
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    });
  } catch (e) {
    console.warn('[auth] Google Sign-In natif indisponible:', e);
  }

  try {
    AppleAuthentication = require('expo-apple-authentication');
  } catch (e) {
    console.warn('[auth] Apple Authentication natif indisponible:', e);
  }
}

// Auth sociale dispo uniquement hors Expo Go (dev build / prod).
const socialAuthAvailable = !isExpoGo && GoogleSignin != null;

export function SignInForm() {
  const router = useRouter();
  const { login, register, loginWithGoogle, loginWithApple, isLoading, error, clearError } = useAuth();
  const { height: screenHeight } = useWindowDimensions();
  const usernameInputRef = React.useRef<TextInput>(null);
  const [mode, setMode] = React.useState<AuthMode>('login');
  const [tabsWidth, setTabsWidth] = React.useState(0);
  const sliderProgress = React.useRef(new Animated.Value(0)).current;
  const bgLineForward = React.useRef(new Animated.Value(0)).current;
  const bgLineBackward = React.useRef(new Animated.Value(0)).current;
  const carTranslateX = React.useRef(new Animated.Value(0)).current;
  const passwordInputRef = React.useRef<TextInput>(null);
  const confirmPasswordInputRef = React.useRef<TextInput>(null);

  const [identifier, setIdentifier] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    clearError();
    setLocalError(null);
  }, [clearError]);

  React.useEffect(() => {
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
    setIdentifier('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  }, [mode, clearError]);

  React.useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  React.useEffect(() => {
    Animated.timing(sliderProgress, {
      toValue: mode === 'login' ? 0 : 1,
      duration: 230,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mode, sliderProgress]);

  React.useEffect(() => {
    const forwardLoop = Animated.loop(
      Animated.timing(bgLineForward, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const backwardLoop = Animated.loop(
      Animated.timing(bgLineBackward, {
        toValue: 1,
        duration: 3100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    forwardLoop.start();
    backwardLoop.start();

    return () => {
      forwardLoop.stop();
      backwardLoop.stop();
      bgLineForward.setValue(0);
      bgLineBackward.setValue(0);
    };
  }, [bgLineBackward, bgLineForward]);

  React.useEffect(() => {
    const carLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(carTranslateX, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(carTranslateX, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    carLoop.start();
    return () => {
      carLoop.stop();
      carTranslateX.setValue(0);
    };
  }, [carTranslateX]);

  const carX = carTranslateX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  const tabWidth = tabsWidth > 0 ? tabsWidth / 2 : 0;
  const indicatorTranslateX = sliderProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabWidth],
  });
  const speedLineForwardX = bgLineForward.interpolate({
    inputRange: [0, 1],
    outputRange: [-260, 260],
  });
  const speedLineBackwardX = bgLineBackward.interpolate({
    inputRange: [0, 1],
    outputRange: [260, -260],
  });

  function onEmailSubmitEditing() {
    if (mode === 'register') {
      usernameInputRef.current?.focus();
      return;
    }
    passwordInputRef.current?.focus();
  }

  function onPasswordSubmitEditing() {
    if (mode === 'register') {
      confirmPasswordInputRef.current?.focus();
      return;
    }
    void onSubmit();
  }

  async function onSubmit() {
    setLocalError(null);
    setSuccessMessage(null);

    if (mode === 'login') {
      if (!identifier.trim()) {
        setLocalError("Email ou pseudo requis.");
        return;
      }
      if (!password) {
        setLocalError('Mot de passe requis.');
        return;
      }
      await login(identifier.trim(), password);
      return;
    }

    const validationError = getRegisterErrorMessage(identifier, username, password, confirmPassword);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    const result = await register({
      email: identifier.trim(),
      username: username.trim(),
      password,
      confirmPassword,
    });

    if (!result.ok) {
      setLocalError(result.error ?? "L'inscription a echoue");
      return;
    }

    // Clear fields if registration succeeded; profile view should appear via auth state.
    setIdentifier('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setSuccessMessage('Compte cree avec succes.');
  }

  async function onGooglePress() {
    setLocalError(null);
    if (!GoogleSignin) {
      setLocalError('Connexion Google indisponible dans Expo Go. Utilise un development build.');
      return;
    }
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.data?.idToken) {
        const result = await loginWithGoogle(userInfo.data.idToken);
        if (!result.ok) setLocalError(result.error ?? "Erreur Google Auth");
      } else {
        setLocalError("Jeton Google introuvable");
      }
    } catch (error: any) {
      if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
        // user cancelled
      } else {
        setLocalError(error.message || "Erreur Google");
      }
    }
  }

  async function onApplePress() {
    setLocalError(null);
    if (!AppleAuthentication) {
      setLocalError('Connexion Apple indisponible dans Expo Go. Utilise un development build.');
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const result = await loginWithApple(credential.identityToken, credential.email || undefined, credential.fullName || undefined);
        if (!result.ok) setLocalError(result.error ?? "Erreur Apple Auth");
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // user cancelled
      } else {
        setLocalError(e.message || "Erreur Apple");
      }
    }
  }

  const displayError = localError || error;

  const isRegister = mode === 'register';
  const registerContentMaxHeight = Math.max(320, screenHeight - 180);

  return (
    <View
      className={`overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0f] shadow-xl shadow-black/50 ${isRegister ? 'p-4' : 'p-5'}`}>
      <View pointerEvents="none" className="absolute inset-0">
        <Animated.View
          className="absolute top-10 h-px w-28 bg-[#ef1f14]/35"
          style={{ transform: [{ translateX: speedLineForwardX }] }}
        />
        <Animated.View
          className="absolute top-16 h-px w-16 bg-[#ef1f14]/25"
          style={{ transform: [{ translateX: speedLineForwardX }] }}
        />
        <Animated.View
          className="absolute top-28 h-px w-24 bg-white/20"
          style={{ transform: [{ translateX: speedLineBackwardX }] }}
        />
        <Animated.View
          className="absolute bottom-28 h-px w-32 bg-[#ef1f14]/30"
          style={{ transform: [{ translateX: speedLineForwardX }] }}
        />
        <Animated.View
          className="absolute bottom-16 h-px w-20 bg-white/20"
          style={{ transform: [{ translateX: speedLineBackwardX }] }}
        />
      </View>
      <View className="absolute -top-14 left-20 h-28 w-28 rounded-full bg-[#ef1f14]/20" />
      <View className="absolute -right-12 top-40 h-32 w-32 rounded-full bg-[#ef1f14]/10" />
      <ScrollView
        scrollEnabled={isRegister}
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        style={isRegister ? { maxHeight: registerContentMaxHeight } : undefined}
        contentContainerStyle={{ paddingBottom: isRegister ? 8 : 0 }}>
        <Animated.View style={{ transform: [{ translateX: carX }] }}>
          <Image
            source={CAR_IMAGE_URI}
            className={isRegister ? 'h-16 w-full' : 'h-20 w-full'}
            resizeMode="contain"
          />
        </Animated.View>

        <Text className={isRegister ? 'text-3xl font-bold italic tracking-wide text-white' : 'text-4xl font-bold italic tracking-wide text-white'}>
          POLEWIN
        </Text>
        <Text className={isRegister ? 'mt-1 text-[20px] leading-6 text-white' : 'mt-2 text-[24px] leading-7 text-white'}>
          Pronostique sur la F1.
        </Text>
        <Text className={isRegister ? 'text-[20px] leading-6 text-white' : 'text-[24px] leading-7 text-white'}>
          Montre que t&apos;es le meilleur.
        </Text>

        <View
          className={`relative flex-row border-b border-white/10 pb-2 ${isRegister ? 'mt-3' : 'mt-4'}`}
          onLayout={(e) => setTabsWidth(e.nativeEvent.layout.width)}>
          <Animated.View
            className="absolute bottom-0 h-0.5 rounded-full bg-[#ef2a1f]"
            style={{
              width: tabWidth || undefined,
              transform: [{ translateX: indicatorTranslateX }],
            }}
          />
          <Pressable onPress={() => setMode('login')} disabled={isLoading} className="flex-1 pb-2">
            <Text className={mode === 'login' ? 'text-center text-base font-bold uppercase tracking-wide text-[#ef2a1f]' : 'text-center text-base font-semibold uppercase tracking-wide text-white/85'}>
              Connexion
            </Text>
          </Pressable>
          <Pressable onPress={() => setMode('register')} disabled={isLoading} className="flex-1 pb-2">
            <Text className={mode === 'register' ? 'text-center text-base font-bold uppercase tracking-wide text-[#ef2a1f]' : 'text-center text-base font-semibold uppercase tracking-wide text-white/85'}>
              Inscription
            </Text>
          </Pressable>
        </View>

        {displayError ? (
          <View className="mt-4 rounded-md bg-destructive/10 p-3">
            <Text className="text-destructive text-sm">{displayError}</Text>
          </View>
        ) : null}
        {successMessage ? (
          <View className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
            <Text className="text-emerald-300 text-sm">{successMessage}</Text>
          </View>
        ) : null}

        <View className={isRegister ? 'mt-2 gap-2' : 'mt-3 gap-2.5'}>
          <View className="relative">
            <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Icon as={Mail} size={18} className="text-[#3395ff]" />
            </View>
            <Input
              id="identifier"
              placeholder={mode === 'login' ? 'Email ou pseudo' : 'Email'}
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
              autoComplete={mode === 'login' ? 'username' : 'email'}
              autoCapitalize="none"
              onSubmitEditing={onEmailSubmitEditing}
              returnKeyType="next"
              submitBehavior="submit"
              editable={!isLoading}
              className="h-12 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
            />
          </View>

          {mode === 'register' ? (
            <View className="relative">
              <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Icon as={User} size={18} className="text-[#3395ff]" />
              </View>
              <Input
                ref={usernameInputRef}
                id="username"
                placeholder="Pseudo"
                value={username}
                onChangeText={setUsername}
                autoComplete="username"
                autoCapitalize="none"
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus();
                }}
                returnKeyType="next"
                editable={!isLoading}
                className="h-12 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
              />
            </View>
          ) : null}

          <View className="relative">
            <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Icon as={Lock} size={18} className="text-[#3395ff]" />
            </View>
            <Input
              ref={passwordInputRef}
              id="password"
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType={mode === 'register' ? 'next' : 'send'}
              onSubmitEditing={onPasswordSubmitEditing}
              editable={!isLoading}
              className="h-12 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
            />
          </View>

          {mode === 'login' && (
            <View className="flex-row justify-end mt-1 mb-2 pr-1">
              <Pressable onPress={() => router.push('/forgot-password' as any)}>
                <Text className="text-[11px] text-white/50 font-semibold underline">Mot de passe oublié ?</Text>
              </Pressable>
            </View>
          )}

          {mode === 'register' ? (
            <View className="relative">
              <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Icon as={Lock} size={18} className="text-[#3395ff]" />
              </View>
              <Input
                ref={confirmPasswordInputRef}
                id="confirmPassword"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
                editable={!isLoading}
                className="h-12 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
              />
            </View>
          ) : null}

          <Button
            className="mt-1 h-12 w-full flex-row items-center justify-center rounded-xl bg-[#ef1f14]"
            onPress={onSubmit}
            disabled={isLoading}>
            <Text className="text-base font-bold uppercase text-white">
              {isLoading
                ? mode === 'login'
                  ? 'Connexion...'
                  : 'Inscription...'
                : mode === 'login'
                  ? 'Se connecter'
                  : "S'inscrire"}
            </Text>
            <Icon as={RefreshCcw} size={18} className="text-white" />
          </Button>
        </View>

        {socialAuthAvailable ? (
          <>
            <View className={isRegister ? 'mt-3 flex-row items-center' : 'mt-4 flex-row items-center'}>
              <Separator className="flex-1 bg-white/20" />
              <Text className="px-4 text-2xl text-white/85">ou</Text>
              <Separator className="flex-1 bg-white/20" />
            </View>

            <View className={isRegister ? 'mt-2 gap-2' : 'mt-3 gap-2.5'}>
              <Button
                variant="outline"
                className="h-12 rounded-xl border border-white/70 bg-black"
                onPress={onGooglePress}>
                <Image
                  source={{ uri: GOOGLE_LOGO_URI }}
                  className="h-5 w-5"
                  resizeMode="contain"
                />
                <Text className="text-base font-semibold text-white">Continuer avec Google</Text>
              </Button>

              <Button
                variant="outline"
                className="h-12 rounded-xl border-white/70 bg-black"
                onPress={onApplePress}>
                <Icon as={Apple} size={18} className="text-white" />
                <Text className="text-base font-semibold text-white">Continuer avec Apple</Text>
              </Button>
            </View>
          </>
        ) : (
          <View className={isRegister ? 'mt-3' : 'mt-4'}>
            <Text className="text-center text-xs leading-4 text-white/50">
              Connexion Google / Apple indisponible dans Expo Go. Utilise un development build pour l&apos;activer.
            </Text>
          </View>
        )}

        <Pressable className="mt-4" onPress={() => router.replace('/(tabs)')}>
          <Text className="text-center text-sm font-semibold text-white/50 underline">Continuer sans compte</Text>
        </Pressable>

        <Text className={isRegister ? 'mt-4 text-center text-[10px] leading-3 text-white/60' : 'mt-6 text-center text-xs leading-4 text-white/60'}>
          En creant un compte, tu acceptes les CGU et la Politique de Confidentialite.
        </Text>
      </ScrollView>
    </View>
  );
}
