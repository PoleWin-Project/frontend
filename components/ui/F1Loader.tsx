import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Text } from '@/components/ui/text';

export function F1Loader() {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View className="items-center justify-center p-12">
            <View className="w-20 h-20 items-center justify-center">
                {/* Outer ring */}
                <Animated.View
                    style={{ transform: [{ rotate: spin }] }}
                    className="w-full h-full rounded-full border-[3px] border-primary border-b-transparent border-l-transparent"
                />
                {/* Inner ring spinning slower/opposite */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        width: '60%', height: '60%',
                        borderRadius: 99,
                        borderWidth: 1.5,
                        borderColor: 'rgba(239,68,68,0.3)',
                        borderTopColor: '#ef4444',
                        transform: [{ rotate: spinValue.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }) }]
                    }}
                />
                {/* Center dot */}
                <View className="absolute w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_#ef4444]" />
            </View>
            <View className="mt-6 items-center">
                <Text className="text-[10px] font-black text-primary uppercase tracking-[6px] italic">
                    Polewin
                </Text>
                <Text className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-[2px] mt-1">
                    Telemetry Sync
                </Text>
            </View>
        </View>
    );
}
