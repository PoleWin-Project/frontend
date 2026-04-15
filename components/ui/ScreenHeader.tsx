import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    showPoints?: boolean;
}

export function ScreenHeader({ title, subtitle, showPoints = false }: ScreenHeaderProps) {
    const { user } = useAuth();

    // Split title to highlight the last word in primary color (e.g., "Pronos Win")
    const words = title.split(' ');
    const lastWord = words.pop();
    const firstPart = words.join(' ');

    return (
        <SafeAreaView edges={['top']} className="bg-card">
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-border/10">
                <View>
                    <Text className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                        {firstPart} <Text className="text-primary">{lastWord}</Text>
                    </Text>
                    {subtitle && (
                        <Text className="text-[10px] text-muted-foreground font-bold uppercase tracking-[2px] mt-0.5">
                            {subtitle}
                        </Text>
                    )}
                </View>
                
                {showPoints && (
                    <View className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                        <Trophy size={14} color="#ef4444" />
                        <Text className="text-sm font-bold text-primary ml-2 tracking-tight">
                            {user?.points?.toLocaleString() || '0'} pts
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
