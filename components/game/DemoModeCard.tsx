import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { Zap, Flag, X, Clock } from 'lucide-react-native';
import { useDemo, DEMO_SESSION_KEY, DEMO_RACE_DURATION_SEC, DEMO_PRE_RACE_SEC } from '@/context/DemoContext';

function formatCountdown(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export function DemoModeCard() {
    const router = useRouter();
    const demo = useDemo();
    const [remaining, setRemaining] = useState<number>(0);
    const [launching, setLaunching] = useState(false);

    useEffect(() => {
        if (!demo.active || !demo.raceStartsAt) return;
        const tick = () => {
            const r = Math.max(0, Math.floor((new Date(demo.raceStartsAt!).getTime() - Date.now()) / 1000));
            setRemaining(r);
            if (r === 0 && !launching) {
                setLaunching(true);
                const startedAt = demo.raceStartsAt!;
                router.push({
                    pathname: '/live-session/[sessionKey]',
                    params: {
                        sessionKey: String(DEMO_SESSION_KEY),
                        demo: '1',
                        startedAt,
                        durationSec: String(DEMO_RACE_DURATION_SEC),
                    },
                });
            }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [demo.active, demo.raceStartsAt, launching, router]);

    const preRaceMin = Math.round(DEMO_PRE_RACE_SEC / 60);
    const raceMin = Math.round(DEMO_RACE_DURATION_SEC / 60);

    if (!demo.active) {
        return (
            <TouchableOpacity
                onPress={demo.startDemo}
                activeOpacity={0.85}
                className="mb-4 rounded-2xl overflow-hidden border border-amber-400/40"
                style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)' }}
            >
                <View className="p-4 flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-amber-400/20 items-center justify-center mr-3">
                        <Zap size={18} color="#fbbf24" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-amber-300 text-xs font-black uppercase tracking-widest">Mode Démo</Text>
                        <Text className="text-white/70 text-[11px] mt-0.5">Simule un GP Monaco 2024 — {preRaceMin} min de pronos puis {raceMin} min de course</Text>
                    </View>
                    <Text className="text-amber-300 font-black text-lg">›</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View
            className="mb-4 rounded-2xl overflow-hidden border border-amber-400/60"
            style={{ backgroundColor: 'rgba(251, 191, 36, 0.12)' }}
        >
            <View className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                        <Text className="text-amber-300 text-[10px] font-black uppercase tracking-widest">
                            Démo active · Monaco 2024
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="flex-row items-center bg-amber-400/15 px-2 py-0.5 rounded-full mr-2">
                            <Clock size={10} color="#fbbf24" />
                            <Text className="text-amber-300 text-[9px] font-bold uppercase tracking-widest ml-1">
                                Course {raceMin} min
                            </Text>
                        </View>
                        <TouchableOpacity onPress={demo.cancelDemo} className="p-1">
                            <X size={14} color="#fbbf24" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="flex-row items-center justify-between mt-1">
                    <View>
                        <Text className="text-white/60 text-[9px] font-bold uppercase tracking-widest">Départ dans</Text>
                        <Text className="text-amber-300 text-4xl font-black italic">{formatCountdown(remaining)}</Text>
                    </View>
                    <View className="items-end">
                        {demo.pick ? (
                            <>
                                <Text className="text-white/60 text-[9px] font-bold uppercase tracking-widest">Votre pari</Text>
                                <View className="flex-row items-center mt-1">
                                    <Flag size={14} color="#fbbf24" />
                                    <Text className="text-white font-black text-lg ml-1">{demo.pick}</Text>
                                </View>
                                <Text className="text-amber-300/80 text-[10px] font-bold">{demo.stake} pts misés</Text>
                            </>
                        ) : (
                            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                Choisis ton pilote ↓
                            </Text>
                        )}
                    </View>
                </View>

                {launching && (
                    <View className="flex-row items-center justify-center mt-3 pt-3 border-t border-amber-400/20">
                        <ActivityIndicator color="#fbbf24" size="small" />
                        <Text className="text-amber-300 text-xs font-bold uppercase tracking-widest ml-2">
                            Lancement de la course...
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}
