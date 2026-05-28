import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function GuestPrompt({ title, description }: { title: string, description: string }) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-[#050507]" style={{ paddingTop: insets.top }}>
            <View className="flex-1 items-center justify-center p-8">
                <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6 border border-primary/20">
                    <Lock size={32} color="#E10600" />
                </View>
                <Text className="text-2xl font-black text-white italic uppercase tracking-wider mb-2 text-center">
                    {title}
                </Text>
                <Text className="text-white/60 text-center mb-10 text-base leading-6">
                    {description}
                </Text>
                <Button 
                    className="w-full h-14 rounded-2xl bg-primary flex-row items-center justify-center"
                    onPress={() => router.push('/(auth)/sign-in')}
                >
                    <Text className="text-white font-black uppercase text-base tracking-wider">
                        Créer un compte
                    </Text>
                </Button>
            </View>
        </View>
    );
}
