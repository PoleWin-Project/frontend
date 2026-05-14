import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, Flag, Trophy, ChevronUp } from 'lucide-react-native';
import { LiveCircuitMap } from '@/components/live/LiveCircuitMap';
import { LiveChat } from '@/components/live/LiveChat';
import { LeaderboardSheet } from '@/components/live/LeaderboardSheet';
import { fetchDrivers, Driver } from '@/lib/api/meetings';
import { useDemo, DEMO_RACE_DURATION_SEC } from '@/context/DemoContext';

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

interface DriverPath {
    driver_number: number;
    path: { x: number; y: number }[];
}

function DemoTimer({ startedAt, durationSec }: { startedAt: string; durationSec: number }) {
    const [text, setText] = useState('--:--');
    useEffect(() => {
        if (!startedAt) return;
        const tick = () => {
            const elapsedSec = Math.max(0, (Date.now() - new Date(startedAt).getTime()) / 1000);
            const remaining = Math.max(0, Math.floor(durationSec - elapsedSec));
            const m = Math.floor(remaining / 60);
            const s = remaining % 60;
            const pct = Math.min(100, Math.floor((elapsedSec / durationSec) * 100));
            setText(`${m}:${String(s).padStart(2, '0')} restantes · ${pct}%`);
        };
        tick();
        const id = setInterval(tick, 500);
        return () => clearInterval(id);
    }, [startedAt, durationSec]);
    return <>{text}</>;
}

export default function LiveSessionScreen() {
    const params = useLocalSearchParams<{ sessionKey: string; demo?: string; startedAt?: string; durationSec?: string }>();
    const sessionKey = params.sessionKey;
    const isDemo = params.demo === '1';
    const demoStartedAt = params.startedAt ?? '';
    const demoDurationSec = Number(params.durationSec ?? DEMO_RACE_DURATION_SEC);
    const router = useRouter();
    const demo = useDemo();
    const [locations, setLocations] = useState<Location[]>([]);
    const [paths, setPaths] = useState<DriverPath[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [trackPoints, setTrackPoints] = useState<{ x: number, y: number }[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [demoEnded, setDemoEnded] = useState(false);

    const locationPoll = useRef<any>(null);
    const positionPoll = useRef<any>(null);

    // Auto-end de la démo quand le temps écoulé dépasse la durée
    useEffect(() => {
        if (!isDemo || !demoStartedAt || demoEnded) return;
        const tick = () => {
            const elapsed = (Date.now() - new Date(demoStartedAt).getTime()) / 1000;
            if (elapsed >= demoDurationSec) {
                setDemoEnded(true);
                const result = demo.endDemo();
                if (result) {
                    Alert.alert(
                        result.won ? '🏆 Bravo !' : '😢 Perdu !',
                        result.won
                            ? `${result.winner} a gagné Monaco 2024 — comme tu l'avais prédit ! +${demo.stake * 2} pts`
                            : `Le vainqueur est ${result.winner} (Leclerc). Mise perdue : ${demo.stake} pts.`,
                        [{ text: 'OK', onPress: () => router.back() }],
                    );
                } else {
                    router.back();
                }
            }
        };
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [isDemo, demoStartedAt, demoDurationSec, demoEnded, demo, router]);

    useEffect(() => {
        async function init() {
            const drvs = await fetchDrivers(Number(sessionKey));
            setDrivers(drvs);
            setLoading(false);
        }
        init();

        const locationsIntervalMs = isDemo ? 400 : 2000;
        const positionsIntervalMs = isDemo ? 1500 : 5000;

        const buildUrl = (endpoint: 'locations' | 'positions') => {
            if (isDemo) {
                const qs = new URLSearchParams({
                    startedAt: demoStartedAt,
                    durationSec: String(demoDurationSec),
                    ...(endpoint === 'locations' ? { frameMs: String(locationsIntervalMs) } : {}),
                }).toString();
                return `${API_URL}/openf1/demo/${sessionKey}/${endpoint}?${qs}`;
            }
            return `${API_URL}/openf1/sessions/${sessionKey}/${endpoint}`;
        };

        const pollLocations = async () => {
            try {
                const res = await fetch(buildUrl('locations'));
                const data = await res.json();
                if (!data.locations) return;

                if (isDemo) {
                    // Format démo : chaque entrée a un `path` de waypoints.
                    const pathsData = data.locations as DriverPath[];
                    setPaths(pathsData);
                    // Track scatter alimenté par tous les waypoints
                    setTrackPoints(prev => {
                        const next = [...prev];
                        for (const dp of pathsData) {
                            for (const p of dp.path) {
                                const exists = next.some(q => Math.abs(q.x - p.x) < 30 && Math.abs(q.y - p.y) < 30);
                                if (!exists) next.push({ x: p.x, y: p.y });
                            }
                        }
                        return next.length > 1500 ? next.slice(next.length - 1500) : next;
                    });
                } else {
                    setLocations(data.locations as Location[]);
                    setTrackPoints(prev => {
                        const next = [...prev];
                        data.locations.forEach((loc: Location) => {
                            const exists = next.some(p => Math.abs(p.x - loc.x) < 30 && Math.abs(p.y - loc.y) < 30);
                            if (!exists) next.push({ x: loc.x, y: loc.y });
                        });
                        return next.length > 1500 ? next.slice(next.length - 1500) : next;
                    });
                }
            } catch (e) {
                // swallow poll errors
            }
        };

        const pollPositions = async () => {
            try {
                const res = await fetch(buildUrl('positions'));
                const data = await res.json();
                if (data.positions) setPositions(data.positions);
            } catch (e) {
                // swallow poll errors
            }
        };

        pollLocations();
        pollPositions();
        locationPoll.current = setInterval(pollLocations, locationsIntervalMs);
        positionPoll.current = setInterval(pollPositions, positionsIntervalMs);

        return () => {
            if (locationPoll.current) clearInterval(locationPoll.current);
            if (positionPoll.current) clearInterval(positionPoll.current);
        };
    }, [sessionKey, isDemo, demoStartedAt, demoDurationSec]);

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
                        <View className={`w-2 h-2 rounded-full ${isDemo ? 'bg-amber-400' : 'bg-red-500'}`} />
                        <Text className="text-white font-black uppercase italic tracking-widest text-sm">
                            {isDemo ? 'Démo Monaco 2024' : 'Séance en direct'}
                        </Text>
                    </View>
                    <Text className={`text-[9px] font-bold uppercase tracking-widest ${isDemo ? 'text-amber-300' : 'text-primary'}`}>
                        {isDemo ? <DemoTimer startedAt={demoStartedAt} durationSec={demoDurationSec} /> : `Live Tracker · ${locations.length} pilotes`}
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
                    paths={isDemo ? paths : undefined}
                    pathDurationMs={isDemo ? 400 : undefined}
                    trackPoints={trackPoints}
                    teamColors={teamColorsMap}
                    size={mapSize}
                    tweenMs={isDemo ? 380 : 1800}
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
