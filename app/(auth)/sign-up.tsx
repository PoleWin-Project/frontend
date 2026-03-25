import { SignUpForm } from '@/components/sign-up-form';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function SignUpScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="bg-[#050507]"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="sm:flex-1 items-center justify-center p-4 py-8 sm:py-4 sm:p-6 mt-safe"
      keyboardDismissMode="interactive">
      <View className="w-full max-w-sm">
        <SignUpForm
          onSuccess={() => router.replace('/(tabs)/profile')}
          onSignInPress={() => router.back()}
        />
      </View>
      <Button variant="ghost" onPress={() => router.back()} className="mt-4">
        <Text className="text-muted-foreground">Retour</Text>
      </Button>
    </ScrollView>
  );
}
