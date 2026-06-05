import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  ActivityIndicator
} from 'react-native';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';
import { forgotPassword } from '@/lib/api/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    setIsLoading(true);
    const result = await forgotPassword(email.trim());
    setIsLoading(false);

    if (result.ok) {
      setMessage("Si un compte est associé à cette adresse, vous recevrez un email contenant un lien pour réinitialiser votre mot de passe.");
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
          <Pressable onPress={() => router.back()} className="mb-6 flex-row items-center">
            <Icon as={ArrowLeft} size={20} className="text-white/60 mr-2" />
            <Text className="text-white/60 font-semibold">Retour</Text>
          </Pressable>

          <Text className="text-2xl font-bold italic tracking-wide text-white mb-2">
            Mot de passe oublié ?
          </Text>
          <Text className="text-sm leading-5 text-white/70 mb-6">
            Saisissez l'adresse email associée à votre compte. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>

          {error ? (
            <View className="mb-4 rounded-md bg-destructive/10 p-3 border border-destructive/20">
              <Text className="text-destructive text-sm">{error}</Text>
            </View>
          ) : null}

          {message ? (
            <View className="mb-4 rounded-md bg-emerald-500/10 p-4 border border-emerald-500/30">
              <Text className="text-emerald-400 text-sm font-medium text-center">{message}</Text>
              <Button 
                className="mt-4 h-12 w-full rounded-xl bg-[#ef1f14]"
                onPress={() => router.push('/sign-in' as any)}
              >
                <Text className="text-white font-bold uppercase">Retour à la connexion</Text>
              </Button>
            </View>
          ) : (
            <View className="gap-4">
              <View className="relative">
                <View className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <Icon as={Mail} size={18} className="text-[#3395ff]" />
                </View>
                <Input
                  id="email"
                  placeholder="Votre email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                  className="h-12 rounded-xl border-white/20 bg-black/30 pl-11 text-white placeholder:text-white/50"
                  onSubmitEditing={onSubmit}
                />
              </View>

              <Button
                className="h-12 w-full flex-row items-center justify-center rounded-xl bg-[#ef1f14]"
                onPress={onSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-base font-bold uppercase text-white mr-2">
                      Envoyer le lien
                    </Text>
                    <Icon as={Send} size={18} className="text-white" />
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
