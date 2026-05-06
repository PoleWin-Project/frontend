import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, Flag, Trophy, ChevronUp } from 'lucide-react-native';
import { LiveCircuitMap } from '@/components/live/LiveCircuitMap';
import { LiveChat } from '@/components/live/LiveChat';
import { LeaderboardSheet } from '@/components/live/LeaderboardSheet';
import { fetchDrivers, Driver } from '@/lib/api/meetings';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface Position {
    driver_number: number;
    position: number;
}

interface Location {
    driver_number: number;
    x: number;
    y: number;
}

export default function LiveSessionScreen() {
    const { sessionKey } = useLocalSearchParams();
    const router = useRouter();
    const [locations, setLocations] = useState<Location[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [trackPoints, setTrackPoints] = useState<{ x: number, y: number }[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const locationPoll = useRef<any>(null);
    const positionPoll = useRef<any>(null);

    useEffect(() => {
        async function init() {
            const drvs = await fetchDrivers(Number(sessionKey));
            setDrivers(drvs);
            setLoading(false);
        }
        init();

        const pollLocations = async () => {
            try {
                const res = await fetch(`${API_URL}/openf1/sessions/${sessionKey}/locations`);
                const data = await res.json();
                if (data.locations) {
                    setLocations(data.locations);
                    setTrackPoints(prev => {
                        const next = [...prev];
                        data.locations.forEach((loc: Location) => {
                            const exists = next.some(p => Math.abs(p.x - loc.x) < 30 && Math.abs(p.y - loc.y) < 30);
                            if (!exists) next.push({ x: loc.x, y: loc.y });
                        });
                        // Cap stored points to avoid unbounded growth
                        return next.length > 1500 ? next.slice(next.length - 1500) : next;
                    });
                }
            } catch (e) {
                // swallow poll errors
            }
        };

        const pollPositions = async () => {
            try {
                const res = await fetch(`${API_URL}/openf1/sessions/${sessionKey}/positions`);
                const data = await res.json();
                if (data.positions) setPositions(data.positions);
            } catch (e) {
                // swallow poll errors
            }
        };

        pollLocations();
        pollPositions();
        locationPoll.current = setInterval(pollLocations, 2000);
        positionPoll.current = setInterval(pollPositions, 5000);

        return () => {
            if (locationPoll.current) clearInterval(locationPoll.current);
            if (positionPoll.current) clearInterval(positionPoll.current);
        };
    }, [sessionKey]);

    const teamColorsMap = useMemo(() => {
        const map: Record<number, string> = {};
        drivers.forEach(d => {
            map[d.driver_number] = d.team_colour;
        });
        return map;
    }, [drivers]);

    const podium = useMemo(() => {
        return [...positions]
            .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
            .slice(0, 3);
    }, [positions]);

    if (loading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator color="#E10600" />
                <Text className="text-muted-foreground mt-4 font-bold uppercase tracking-widest">
                    Initialisation Télémétrie...
                </Text>
            </View>
        );
    }

    const mapSize = Math.min(SCREEN_WIDTH - 32, SCREEN_HEIGHT * 0.32);

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-4 pt-12 pb-3 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2 bg-white/5 rounded-full border border-white/10"
                >
                    <Icon as={ChevronLeft} size={22} className="text-white" />
                </TouchableOpacity>
                <View className="items-center">
                    <View className="flex-row items-center gap-2">
                        <View className="w-2 h-2 rounded-full bg-red-500" />
                        <Text className="text-white font-black uppercase italic tracking-widest text-sm">
                            Séance en direct
                        </Text>
                    </View>
                    <Text className="text-primary text-[9px] font-bold uppercase tracking-widest">
                        Live Tracker · {locations.length} pilotes
                    </Text>
                </View>
                <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 rounded-full border border-green-500/30">
                    <Flag size={12} color="#22c55e" />
                    <Text className="text-green-500 text-[10px] font-black uppercase tracking-widest">
                        Vert
                    </Text>
                </View>
            </View>

            {/* Circuit Map */}
            <View className="items-center px-4 pb-3">
                <LiveCircuitMap
                    locations={locations}
                    trackPoints={trackPoints}
                    teamColors={teamColorsMap}
                    size={mapSize}
                />
            </View>

            {/* Podium + expand button */}
            <View className="px-4 pb-3">
                <TouchableOpacity
                    onPress={() => setShowLeaderboard(true)}
                    activeOpacity={0.7}
                    className="bg-white/[0.04] rounded-2xl border border-primary/20 px-4 py-3"
                >
                    <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                            <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <Text className="text-red-500 text-[9px] font-black uppercase tracking-widest">
                                Live · OpenF1
                            </Text>
                            <Trophy size={12} color="#E10600" />
                        </View>
                        <View className="flex-row items-center gap-1">
                            <Text className="text-white/50 text-[9px] font-bold uppercase tracking-widest">
                                Voir tout ({positions.length})
                            </Text>
                            <ChevronUp size={12} color="rgba(255,255,255,0.5)" />
                        </View>
                    </View>
                    <View className="flex-row items-center justify-between gap-2">
                        {podium.length === 0 ? (
                            <Text className="text-white/40 text-xs font-bold uppercase tracking-widest py-1">
                                Classement indisponible
                            </Text>
                        ) : (
                            podium.map((p, idx) => {
                                const driver = drivers.find(d => d.driver_number === p.driver_number);
                                const medal = ['#FFD700', '#C0C0C0', '#CD7F32'][idx];
                                return (
                                    <View
                                        key={p.driver_number}
                                        className="flex-1 flex-row items-center gap-2 bg-white/[0.04] rounded-lg px-2.5 py-1.5"
                                    >
                                        <Text style={{ color: medal }} className="font-black text-sm italic">
                                            P{p.position}
                                        </Text>
                                        <View
                                            style={{ backgroundColor: driver ? `#${driver.team_colour}` : '#666' }}
                                            className="w-0.5 h-5 rounded-full"
                                        />
                                        <Text className="text-white font-black italic text-xs">
                                            {driver?.name_acronym || `#${p.driver_number}`}
                                        </Text>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Chat (toujours visible, prend le reste de l'écran) */}
            <View className="flex-1 px-4 pb-4">
                <LiveChat sessionKey={Number(sessionKey)} />
            </View>

            {/* Leaderboard bottom sheet */}
            <LeaderboardSheet
                visible={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                positions={positions}
                drivers={drivers}
            />
        </View>
    );
}
