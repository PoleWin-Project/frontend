import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ActivityIndicator
} from 'react-native';
import { Lock, Save, CheckCircle } from 'lucide-react-native';
import { resetPassword } from '@/lib/api/auth';

const PASSWORD_SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

function validatePassword(password: string, confirmPassword: string) {
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  const confirmPasswordInputRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!token) {
      setError("Jeton de réinitialisation invalide ou manquant.");
    }
  }, [token]);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    
    if (!token) {
      setError('Jeton manquant. Veuillez recliquer sur le lien dans votre email.');
      return;
    }

    const validationError = validatePassword(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(token, password, confirmPassword);
    setIsLoading(false);

    if (result.ok) {
      setMessage("Votre mot de passe a été réinitialisé avec succès !");
    } else {
      setError(result.error);
    }
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-[#050507]" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-1 items-center justify-center p-4"
      >
        <View className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0f] shadow-xl shadow-black/50 p-5">
          
          <Text className="text-2xl font-bold italic tracking-wide text-white mb-2">
            Nouveau mot de passe
          </Text>
          <Text className="text-sm leading-5 text-white/70 mb-6">
            Créez un nouveau mot de passe fort pour votre compte.
          </Text>

          {error ? (
            <View className="mb-4 rounded-md bg-destructive/10 p-3 border border-destructive/20">
              <Text className="text-destructive text-sm">{error}</Text>
            </View>
          ) : null}

          {message ? (
            <View className="mb-4 rounded-md bg-emerald-500/10 p-4 border border-emerald-500/30 items-center">
              <Icon as={CheckCircle} size={48} className="text-emerald-400 mb-3" />
              <Text className="text-emerald-400 text-sm font-medium text-center mb-4">{message}</Text>
              <Button 
                className="h-12 w-full rounded-xl bg-[#ef1f14]"
                onPress={() => router.replace('/sign-in' as any)}
              >
                <Text className="text-white font-bold uppercase">Se connecter</Text>
              </Button>
            </View>
          ) : (
            <View className="gap-4">
              <View className="relative">
                <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <Icon as={Lock} size={18} className="text-[#3395ff]" />
                </View>
                <Input
                  id="password"
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading && !!token}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  className="h-12 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
                />
              </View>

              <View className="relative">
                <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <Icon as={Lock} size={18} className="text-[#3395ff]" />
                </View>
                <Input
                  ref={confirmPasswordInputRef}
                  id="confirmPassword"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading && !!token}
                  returnKeyType="send"
                  onSubmitEditing={onSubmit}
                  className="h-12 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
                />
              </View>

              <Button
                className="mt-2 h-12 w-full flex-row items-center justify-center rounded-xl bg-[#ef1f14]"
                onPress={onSubmit}
                disabled={isLoading || !token}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-base font-bold uppercase text-white mr-2">
                      Sauvegarder
                    </Text>
                    <Icon as={Save} size={18} className="text-white" />
                  </>
                )}
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
