import React, { useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { ChevronDown } from 'lucide-react-native';
import { Driver } from '@/lib/api/meetings';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PositionEntry {
    driver_number: number;
    position: number;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    positions: PositionEntry[];
    drivers: Driver[];
}

export function LeaderboardSheet({ visible, onClose, positions, drivers }: Props) {
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: visible ? 1 : 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
    }, [visible]);

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [SCREEN_HEIGHT, 0],
    });

    const sorted = [...positions].sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

    if (!visible && (slideAnim as any)._value === 0) return null;

    return (
        <View className="absolute inset-0" style={{ pointerEvents: visible ? 'auto' : 'none' }}>
            <TouchableOpacity
                className="absolute inset-0 bg-black/60"
                activeOpacity={1}
                onPress={onClose}
            />
            <Animated.View
                style={{
                    transform: [{ translateY }],
                    height: SCREEN_HEIGHT * 0.75,
                }}
                className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a] rounded-t-3xl border-t border-white/10"
            >
                <View className="items-center pt-3 pb-2">
                    <View className="w-12 h-1 bg-white/20 rounded-full" />
                </View>
                <View className="flex-row items-center justify-between px-5 pb-4 border-b border-white/5">
                    <View className="flex-row items-center gap-2">
                        <View className="w-1 h-5 bg-primary rounded-full" />
                        <Text className="text-white font-black uppercase italic tracking-widest text-base">
                            Classement Temps Réel
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        className="p-1.5 bg-white/5 rounded-full"
                    >
                        <ChevronDown size={18} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-5 py-3" showsVerticalScrollIndicator={false}>
                    {sorted.length === 0 ? (
                        <View className="py-12 items-center">
                            <Text className="text-white/30 text-sm font-bold uppercase tracking-widest">
                                Données indisponibles
                            </Text>
                        </View>
                    ) : (
                        sorted.map((entry, index) => {
                            const driver = drivers.find(d => d.driver_number === entry.driver_number);
                            const isPodium = (entry.position ?? 99) <= 3;
                            return (
                                <View
                                    key={entry.driver_number}
                                    className={`flex-row items-center justify-between py-3 px-3 mb-2 rounded-xl ${
                                        isPodium ? 'bg-primary/10 border border-primary/20' : 'bg-white/[0.03]'
                                    } ${index !== sorted.length - 1 ? '' : ''}`}
                                >
                                    <View className="flex-row items-center gap-3 flex-1">
                                        <View className="w-9 items-center">
                                            <Text className={`font-black italic text-lg ${isPodium ? 'text-primary' : 'text-white/60'}`}>
                                                P{entry.position ?? '?'}
                                            </Text>
                                        </View>
                                        <View
                                            style={{ backgroundColor: driver ? `#${driver.team_colour}` : '#333' }}
                                            className="w-1 h-8 rounded-full"
                                        />
                                        <View className="flex-1">
                                            <View className="flex-row items-center gap-2">
                                                <Text className="text-white font-black italic text-base">
                                                    {driver?.name_acronym || `#${entry.driver_number}`}
                                                </Text>
                                                <Text className="text-white/40 text-[10px] font-bold">
                                                    #{entry.driver_number}
                                                </Text>
                                            </View>
                                            <Text className="text-white/40 text-[10px] uppercase tracking-wider">
                                                {driver?.team_name || 'Écurie inconnue'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </Animated.View>
        </View>
    );
}
