import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, Flag, Info, Gauge } from 'lucide-react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LiveCircuitMap } from '@/components/live/LiveCircuitMap';
import { LiveChat } from '@/components/live/LiveChat';
import { fetchDrivers, Driver } from '@/lib/api/meetings';
import { BlurView } from 'expo-blur';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function LiveSessionScreen() {
    const { sessionKey } = useLocalSearchParams();
    const router = useRouter();
    const [locations, setLocations] = useState<any[]>([]);
    const [trackPoints, setTrackPoints] = useState<{ x: number, y: number }[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('LIVE');
    
    // Polling interval
    const pollInterval = useRef<any>(null);

    useEffect(() => {
        async function init() {
            const drvs = await fetchDrivers(Number(sessionKey));
            setDrivers(drvs);
            setLoading(false);
        }
        init();

        // Start Polling Location
        const poll = async () => {
            try {
                // In a real SSE setup we would use EventSource, 
                // but here we use a fast poll to the latest location endpoint.
                const res = await fetch(`${API_URL}/openf1/sessions/${sessionKey}/locations`); // Note: Backend needs this endpoint or we use the live stream.
                // For this implementation, we simulate the SSE flow via a poll to the live cache.
                const data = await res.json();
                if (data.locations) {
                    setLocations(data.locations);
                    
                    // Update track points (Discovery Mode)
                    setTrackPoints(prev => {
                        const newPoints = [...prev];
                        data.locations.forEach((loc: any) => {
                            // Check if point is already in track (within a threshold)
                            const exists = newPoints.some(p => Math.abs(p.x - loc.x) < 50 && Math.abs(p.y - loc.y) < 50);
                            if (!exists) newPoints.push({ x: loc.x, y: loc.y });
                        });
                        return newPoints;
                    });
                }
            } catch (e) {
                console.error("Live poll failed", e);
            }
        };

        pollInterval.current = setInterval(poll, 1000);

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [sessionKey]);

    const teamColorsMap = React.useMemo(() => {
        const map: Record<number, string> = {};
        drivers.forEach(d => {
            map[d.driver_number] = d.team_colour;
        });
        return map;
    }, [drivers]);

    if (loading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator color="#E10600" />
                <Text className="text-muted-foreground mt-4 font-bold uppercase tracking-widest">Initialisation Télémétrie...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background" style={{ position: 'relative' }}>
            <View className="px-4 pt-12 pb-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/5 rounded-full border border-white/10">
                    <Icon as={ChevronLeft} size={24} className="text-white" />
                </TouchableOpacity>
                <View className="items-center">
                    <View className="flex-row items-center gap-2">
                        <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <Text className="text-white font-black uppercase italic tracking-widest">SÉANCE EN DIRECT</Text>
                    </View>
                    <Text className="text-primary text-[10px] font-bold uppercase">PoleWin Live Tracker v1.0</Text>
                </View>
                <TouchableOpacity className="p-2 bg-white/5 rounded-full border border-white/10">
                    <Icon as={Info} size={24} className="text-white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Circuit Map Selection */}
                <View className="mt-4 mb-8">
                    <LiveCircuitMap 
                        locations={locations} 
                        trackPoints={trackPoints} 
                        teamColors={teamColorsMap} 
                    />
                </View>

                {/* Status Cards */}
                <View className="flex-row gap-4 mb-8">
                    <View className="flex-1 bg-white/5 p-4 rounded-3xl border border-white/5">
                        <Flag size={20} className="text-green-500 mb-2" />
                        <Text className="text-white/40 text-[10px] font-bold uppercase mb-1">Drapeau</Text>
                        <Text className="text-white font-black text-lg">VERT</Text>
                    </View>
                    <View className="flex-1 bg-white/5 p-4 rounded-3xl border border-white/5">
                        <Gauge size={20} className="text-primary mb-2" />
                        <Text className="text-white/40 text-[10px] font-bold uppercase mb-1">Voitures</Text>
                        <Text className="text-white font-black text-lg">{locations.length}</Text>
                    </View>
                </View>

                {/* Mini Leaderboard */}
                <Text className="text-white font-black uppercase italic tracking-widest mb-4">Classement Temps Réel</Text>
                <View className="bg-white/5 rounded-3xl border border-white/5 p-4 mb-20">
                    {locations.sort((a, b) => (a.position || 99) - (b.position || 99)).map((loc, index) => {
                        const driver = drivers.find(d => d.driver_number === loc.driver_number);
                        return (
                            <View key={loc.driver_number} className={`flex-row items-center justify-between py-3 ${index !== locations.length - 1 ? 'border-b border-white/5' : ''}`}>
                                <View className="flex-row items-center gap-3">
                                    <View style={{ backgroundColor: driver ? `#${driver.team_colour}` : '#333' }} className="w-1 h-6 rounded-full" />
                                    <Text className="text-white font-black italic">#{loc.driver_number}</Text>
                                    <View>
                                        <Text className="text-white text-sm font-bold uppercase">{driver?.name_acronym || '???'}</Text>
                                        <Text className="text-white/40 text-[10px] uppercase">{driver?.team_name || 'Écurie Inconnue'}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-primary font-black text-xs italic">POS {index + 1}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Live Chat */}
            <LiveChat sessionKey={Number(sessionKey)} />
        </View>
    );
}
