import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Link } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

export default function ExploreScreen() {
    return (
        <View className="flex-1 items-center justify-center gap-8 p-4">
            <Link href="https://reactnativereusables.com" asChild>
                <Text>Game</Text>
            </Link>
        </View>
    );
}