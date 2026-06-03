import React from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { Gamepad2, Trophy, Users, Flag } from 'lucide-react-native';

const QUICK_ACTIONS = [
    { id: 'pronostics', label: 'Pronostics', icon: Gamepad2, color: '#ef4444', route: '/pronostics' },
    { id: 'standings', label: 'Classement', icon: Trophy, color: '#f59e0b', route: '/classement' },
    { id: 'teams', label: 'Écuries', icon: Users, color: '#3b82f6', route: '/classement' },
    { id: 'drivers', label: 'Pilotes', icon: Flag, color: '#10b981', route: '/classement' },
];

export function QuickStats() {
    const router = useRouter();
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 10 }}
            className="mb-10"
        >
            <View className="flex-row gap-5">
                {QUICK_ACTIONS.map((action) => (
                    <TouchableOpacity
                        key={action.id}
                        activeOpacity={0.7}
                        onPress={() => router.push(action.route as any)}
                        className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl items-center justify-center w-[120px] shadow-sm relative overflow-hidden"
                    >
                        {/* Subtle color glow in corner */}
                        <View
                            style={{
                                position: 'absolute', top: -10, right: -10,
                                width: 40, height: 40, borderRadius: 20,
                                backgroundColor: action.color, opacity: 0.1
                            }}
                        />

                        <View
                            style={{ backgroundColor: `${action.color}15` }}
                            className="p-3.5 rounded-xl mb-3 border border-white/5"
                        >
                            <action.icon size={22} color={action.color} />
                        </View>

                        <Text className="text-[10px] font-black text-foreground uppercase tracking-widest italic">{action.label}</Text>

                        {/* Decorative bottom line */}
                        <View style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1, backgroundColor: `${action.color}40` }} />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}
