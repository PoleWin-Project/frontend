import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import * as React from 'react';
import { Lock, Mail, RefreshCcw, User } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';

type SignUpFormProps = {
  onSuccess?: () => void;
  onSignInPress?: () => void;
};

export function SignUpForm({ onSuccess, onSignInPress }: SignUpFormProps) {
  const { register, isLoading, error, clearError } = useAuth();
  const confirmPasswordRef = React.useRef<TextInput>(null);
  const usernameRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);

  const [email, setEmail] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    clearError();
  }, [clearError]);

  function onEmailSubmitEditing() {
    usernameRef.current?.focus();
  }

  function onUsernameSubmitEditing() {
    passwordRef.current?.focus();
  }

  function onPasswordSubmitEditing() {
    confirmPasswordRef.current?.focus();
  }

  async function onSubmit() {
    setLocalError(null);
    if (!email.trim()) {
      setLocalError('Email requis');
      return;
    }
    if (!username.trim()) {
      setLocalError('Pseudo requis (3 à 50 caractères)');
      return;
    }
    if (username.trim().length < 3) {
      setLocalError('Le pseudo doit faire au moins 3 caractères');
      return;
    }
    if (password.length < 8) {
      setLocalError('Le mot de passe doit faire au moins 8 caractères (majuscule, minuscule, chiffre, caractère spécial)');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas');
      return;
    }

    const result = await register({
      email: email.trim(),
      username: username.trim(),
      password,
      confirmPassword,
    });

    if (result.ok) {
      onSuccess?.();
    }
    if (result.error) {
      setLocalError(result.error);
    }
  }

  const displayError = localError || error;

  return (
    <View className="rounded-3xl border border-white/10 bg-[#0c0c0f] p-5 shadow-xl shadow-black/50">
      <Text className="text-4xl font-bold italic tracking-wide text-white">POLEWIN</Text>
      <Text className="mt-3 text-[32px] leading-8 text-white">Pronostique sur la F1.</Text>
      <Text className="text-[32px] leading-8 text-white">Montre que t&apos;es le meilleur.</Text>

      <View className="mt-7 flex-row items-end gap-8 border-b border-white/10 pb-2">
        <Pressable onPress={onSignInPress} disabled={isLoading}>
          <Text className="text-base font-semibold uppercase tracking-wide text-white/85">Connexion</Text>
        </Pressable>
        <View className="border-b-2 border-[#ef2a1f] pb-2">
          <Text className="text-base font-bold uppercase tracking-wide text-[#ef2a1f]">Inscription</Text>
        </View>
      </View>

      {displayError ? (
        <View className="mt-4 rounded-md bg-destructive/10 p-3">
          <Text className="text-destructive text-sm">{displayError}</Text>
        </View>
      ) : null}

      <View className="mt-4 gap-3">
        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <Icon as={Mail} size={18} className="text-[#3395ff]" />
          </View>
          <Input
            id="email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            onSubmitEditing={onEmailSubmitEditing}
            returnKeyType="next"
            submitBehavior="submit"
            editable={!isLoading}
            className="h-14 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
          />
        </View>

        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <Icon as={User} size={18} className="text-[#3395ff]" />
          </View>
          <Input
            ref={usernameRef}
            id="username"
            placeholder="Pseudo"
            value={username}
            onChangeText={setUsername}
            autoComplete="username"
            autoCapitalize="none"
            onSubmitEditing={onUsernameSubmitEditing}
            returnKeyType="next"
            submitBehavior="submit"
            editable={!isLoading}
            className="h-14 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
          />
        </View>

        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <Icon as={Lock} size={18} className="text-[#3395ff]" />
          </View>
          <Input
            ref={passwordRef}
            id="password"
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onSubmitEditing={onPasswordSubmitEditing}
            returnKeyType="next"
            editable={!isLoading}
            className="h-14 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
          />
        </View>

        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <Icon as={Lock} size={18} className="text-[#3395ff]" />
          </View>
          <Input
            ref={confirmPasswordRef}
            id="confirmPassword"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            returnKeyType="send"
            onSubmitEditing={onSubmit}
            editable={!isLoading}
            className="h-14 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
          />
        </View>

        <Button
          className="mt-2 h-14 w-full flex-row items-center justify-center rounded-xl bg-[#ef1f14]"
          onPress={onSubmit}
          disabled={isLoading}>
          <Text className="text-lg font-bold uppercase text-white">
            {isLoading ? 'Inscription...' : 'S&apos;inscrire'}
          </Text>
          <Icon as={RefreshCcw} size={18} className="text-white" />
        </Button>
      </View>

      <View className="mt-5 flex-row items-center">
        <Separator className="flex-1 bg-white/20" />
        <Text className="px-4 text-2xl text-white/85">ou</Text>
        <Separator className="flex-1 bg-white/20" />
      </View>

      <View className="mt-4 gap-3">
        <Button
          variant="outline"
          className="h-14 rounded-xl border-white/70 bg-transparent"
          onPress={() => {
            // TODO: Integrer l'auth Google
          }}>
          <Text className="text-lg text-white">Continuer avec Google</Text>
        </Button>

        <Button
          variant="outline"
          className="h-14 rounded-xl border-white/70 bg-transparent"
          onPress={() => {
            // TODO: Integrer l'auth Apple
          }}>
          <Text className="text-lg text-white">Continuer avec Apple</Text>
        </Button>
      </View>

      <Text className="mt-5 text-center text-sm leading-5 text-white/60">
        En creant un compte, tu acceptes les CGU et la Politique de Confidentialite.
      </Text>
    </View>
  );
}
