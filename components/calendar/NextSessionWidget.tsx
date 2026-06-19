import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { useEffect, useState, useRef } from 'react';
import { fetchMeetings, fetchSessions, MeetingItem, SessionItem } from '@/lib/api/meetings';
import { Calendar as CalendarIcon, MapPin, Clock, Gamepad2 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';

interface CountdownValues {
    days: number;
    hours: number;
    mins: number;
    secs: number;
}

export function NextSessionWidget() {
    const [nextMeeting, setNextMeeting] = useState<MeetingItem | null>(null);
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [nextSession, setNextSession] = useState<SessionItem | null>(null);
    const [countdown, setCountdown] = useState<CountdownValues | null>(null);
    const [isLive, setIsLive] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        async function loadNextMeetingAndSessions() {
            try {
                const allMeetings = await fetchMeetings();
                const now = Date.now();

                const upcoming = allMeetings
                    .filter(m => new Date(m.date_end).getTime() >= now)
                    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

                if (upcoming.length > 0) {
                    const nearest = upcoming[0];
                    setNextMeeting(nearest);

                    const meetingSessions = await fetchSessions(nearest.meeting_key, nearest.year);

                    const sortedSessions = meetingSessions.sort(
                        (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
                    );
                    setSessions(sortedSessions);
                }
            } catch (err: any) {
                setError(err.message || "Impossible de charger le prochain GP");
            } finally {
                setLoading(false);
            }
        }

        loadNextMeetingAndSessions();
    }, []);

    useEffect(() => {
        if (sessions.length === 0) return;

        function findNextAndUpdate() {
            const now = Date.now();
            const SESSION_DURATION = 2 * 60 * 60 * 1000; // Assume 2 hours per session

            const liveSession = sessions.find(s => {
                const start = new Date(s.date_start).getTime();
                return now >= start && now <= start + SESSION_DURATION;
            });

            if (liveSession) {
                setNextSession(liveSession);
                setCountdown(null);
                setIsLive(true);
            } else {
                const upcoming = sessions.find(s => new Date(s.date_start).getTime() > now);

                if (upcoming) {
                    setNextSession(upcoming);
                    setIsLive(false);
                    const diff = new Date(upcoming.date_start).getTime() - now;
                    setCountdown({
                        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                        mins: Math.floor((diff / (1000 * 60)) % 60),
                        secs: Math.floor((diff / 1000) % 60),
                    });
                } else {
                    setNextSession(null);
                    setCountdown(null);
                    setIsLive(false);
                }
            }
        }

        findNextAndUpdate();
        intervalRef.current = setInterval(findNextAndUpdate, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [sessions]);

    if (loading) {
        return (
            <Card className="p-6 items-center justify-center bg-card/80 border border-border/50 rounded-2xl h-48">
                <ActivityIndicator size="small" className="text-primary mb-2" />
                <Text className="text-muted-foreground text-sm">Recherche du prochain Grand Prix...</Text>
            </Card>
        );
    }

    if (error || !nextMeeting) {
        return (
            <Card className="p-6 items-center justify-center bg-card/80 border border-border/50 rounded-2xl">
                <Text className="text-muted-foreground text-sm">{error || "Aucun Grand Prix à venir trouvé."}</Text>
            </Card>
        );
    }

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDay = (isoString: string) => {
        const date = new Date(isoString);
        const weekdays = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
        const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
        
        return {
            weekday: weekdays[date.getDay()],
            day: date.getDate().toString().padStart(2, '0'),
            month: months[date.getMonth()]
        };
    };

    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
        <View className="mb-8">
            <View className="flex-row items-center gap-3 mb-5 px-1">
                <View className="w-1 h-6 bg-primary rounded-full" />
                <Text className="font-heading text-xl font-black text-foreground uppercase tracking-tighter">
                    Prochain <Text className="text-primary">Event</Text>
                </Text>
            </View>

            <View
                style={{
                    backgroundColor: 'rgba(10,10,10,0.4)',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
                    shadowOpacity: 0.4, shadowRadius: 30, elevation: 15
                }}
            >
                <BlurView intensity={35} tint="dark" className="p-6">
                    <LinearGradient
                        colors={['rgba(255,255,255,0.03)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="absolute inset-0"
                    />

                    {/* Header: GP Name and Location */}
                    <View className="flex-row items-start justify-between pb-6 mb-6 border-b border-white/5">
                        <View className="flex-1 pr-4">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="bg-primary px-1.5 py-0.5 rounded-sm">
                                    <Text className="text-[9px] uppercase tracking-widest text-white font-black">
                                        {nextMeeting.country_name}
                                    </Text>
                                </View>
                                <Text className="text-[10px] text-muted-foreground font-mono uppercase opacity-50">
                                    Track Data v2.0
                                </Text>
                            </View>

                            <Text className="font-heading text-2xl font-black text-white leading-tight uppercase italic">
                                {nextMeeting.meeting_name}
                            </Text>

                            <View className="flex-row items-center mt-3 gap-3">
                                <View className="flex-row items-center bg-white/5 py-1 px-2 rounded-md border border-white/5">
                                    <MapPin size={10} color="#ef4444" className="mr-1.5" />
                                    <Text className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                        {nextMeeting.circuit_short_name}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="items-end">
                            <View className="bg-white/5 p-3 rounded-2xl border border-white/10 items-center justify-center min-w-[70px]">
                                <Text className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-50">Main</Text>
                                <Text className="text-lg font-black text-primary uppercase italic" numberOfLines={1} adjustsFontSizeToFit>{formatDay(nextMeeting.date_start).day}</Text>
                                <Text className="text-[10px] text-white font-bold uppercase" numberOfLines={1} adjustsFontSizeToFit>{formatDay(nextMeeting.date_start).month}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Countdown or LIVE badge */}
                    {nextSession && (isLive ? (
                        <Link href={`/live-session/${nextSession.session_key}`} asChild>
                            <TouchableOpacity activeOpacity={0.7} className="mb-6">
                                <View className="px-4 py-5 rounded-xl bg-red-500/20 border border-red-500/30 flex-row items-center justify-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                    <View className="w-4 h-4 rounded-full bg-red-500 border-2 border-white/20" />
                                    <Text className="text-xl font-black text-white uppercase tracking-widest italic">
                                        {nextSession.session_name} EN COURS
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </Link>
                    ) : countdown && (
                        <View className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Clock size={14} color="#ef4444" />
                                <Text className="text-xs text-primary font-black uppercase tracking-widest">
                                    {nextSession.session_name}
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-between w-full px-1">
                                {countdown.days > 0 && (
                                    <>
                                        <View className="flex-1 items-center bg-white/10 rounded-lg py-2 mx-1">
                                            <Text className="text-xl sm:text-2xl font-black text-white font-mono" numberOfLines={1} adjustsFontSizeToFit>{pad(countdown.days)}</Text>
                                            <Text className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">jours</Text>
                                        </View>
                                        <Text className="text-lg font-black text-primary">:</Text>
                                    </>
                                )}
                                <View className="flex-1 items-center bg-white/10 rounded-lg py-2 mx-1">
                                    <Text className="text-xl sm:text-2xl font-black text-white font-mono" numberOfLines={1} adjustsFontSizeToFit>{pad(countdown.hours)}</Text>
                                    <Text className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5" numberOfLines={1} adjustsFontSizeToFit>heures</Text>
                                </View>
                                <Text className="text-lg font-black text-primary">:</Text>
                                <View className="flex-1 items-center bg-white/10 rounded-lg py-2 mx-1">
                                    <Text className="text-xl sm:text-2xl font-black text-white font-mono" numberOfLines={1} adjustsFontSizeToFit>{pad(countdown.mins)}</Text>
                                    <Text className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">min</Text>
                                </View>
                                <Text className="text-lg font-black text-primary">:</Text>
                                <View className="flex-1 items-center bg-white/10 rounded-lg py-2 mx-1">
                                    <Text className="text-xl sm:text-2xl font-black text-white font-mono" numberOfLines={1} adjustsFontSizeToFit>{pad(countdown.secs)}</Text>
                                    <Text className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">sec</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* Body: Sessions Schedule */}
                    <View className="gap-3">
                        {sessions.length > 0 ? (
                            sessions.map((session, index) => {
                                const isRace = session.session_type === 'Race' || session.session_name.toLowerCase().includes('race');
                                const isQuali = session.session_name.toLowerCase().includes('qualifying');
                                const isNext = nextSession && session.session_key === nextSession.session_key;

                                return (
                                    <View
                                        key={session.session_key}
                                        className={`flex-row items-center justify-between p-3.5 rounded-xl border ${isRace ? 'bg-primary/20 border-primary/40 shadow-lg' : isNext ? 'bg-white/[0.08] border-primary/30' : 'bg-white/[0.03] border-white/5'}`}
                                    >
                                        <View className="flex-row items-center flex-1">
                                            <View className={`w-1 h-4 rounded-full mr-3 ${isRace ? 'bg-primary shadow-[0_0_8px_#ef4444]' : isQuali ? 'bg-orange-500' : 'bg-muted-foreground/30'}`} />
                                            <View>
                                                <Text className={`text-sm tracking-tight ${isRace ? 'font-black text-white uppercase italic' : 'font-bold text-muted-foreground/80'}`}>
                                                    {session.session_name}
                                                </Text>
                                                <Text className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-widest mt-0.5">
                                                    {isNext ? '▸ PROCHAINE' : `Section ${index + 1}`}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center gap-4">
                                            <Text className="text-[10px] text-muted-foreground font-black uppercase tracking-widest text-right">
                                                {formatDay(session.date_start).weekday}
                                            </Text>
                                            <View className={`min-w-[55px] items-center py-1.5 px-2 rounded-lg ${isRace ? 'bg-primary' : 'bg-white/10'}`}>
                                                <Text className={`text-xs font-black tracking-tighter ${isRace ? 'text-white' : 'text-foreground'}`}>
                                                    {formatTime(session.date_start)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View className="items-center py-8">
                                <ActivityIndicator size="small" color="#ef4444" />
                                <Text className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-4 opacity-30">Loading Telemetry...</Text>
                            </View>
                        )}
                    </View>
                    {/* Action: Faire vos pronostics */}
                    <View className="mt-6">
                        <Link href="/pronostics" asChild>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                className="bg-primary py-4 rounded-xl items-center justify-center flex-row gap-2 shadow-lg shadow-primary/30"
                            >
                                <Gamepad2 size={18} color="white" />
                                <Text className="text-white font-black uppercase tracking-widest italic" numberOfLines={1} adjustsFontSizeToFit>
                                    Faire vos pronostics
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </BlurView>
            </View>
        </View>
    );
}

