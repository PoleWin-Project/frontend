import { SignInForm } from '@/components/sign-in-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

export default function ProfileScreen() {
  const { user, isInitialized, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  if (!isInitialized) {
    return (
      <ScrollView
        contentContainerClassName="flex-1 items-center justify-center p-4"
        keyboardShouldPersistTaps="handled">
        <Text className="text-muted-foreground">Chargement…</Text>
      </ScrollView>
    );
  }

  if (user) {
    return (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-1 p-4 py-8 sm:py-4 sm:p-6 mt-safe">
        <View className="w-full max-w-sm mx-auto gap-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex-row items-center gap-3">
              <View className="h-12 w-12 rounded-full bg-primary/20 items-center justify-center">
                <User size={24} className="text-primary" />
              </View>
              <View className="flex-1">
                <CardTitle>{user.username}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </View>
            </CardHeader>
            <CardContent>
              {user.isEmailVerified ? (
                <Text className="text-muted-foreground text-sm">Email vérifié</Text>
              ) : (
                <Text className="text-amber-600 dark:text-amber-400 text-sm">
                  Email non vérifié
                </Text>
              )}
              <Button
                variant="outline"
                className="mt-4 w-full"
                onPress={handleLogout}>
                <Icon as={LogOut} size={18} />
                <Text>Se déconnecter</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-[#050507] px-4 pt-6">
      <View className="w-full max-w-sm self-center">
        <SignInForm />
      </View>
    </View>
  );
}
