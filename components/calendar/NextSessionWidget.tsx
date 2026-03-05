import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { fetchMeetings, fetchSessions, MeetingItem, SessionItem } from '@/lib/api/meetings';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export function NextSessionWidget() {
    const [nextMeeting, setNextMeeting] = useState<MeetingItem | null>(null);
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadNextMeetingAndSessions() {
            try {
                // Fetch the calendar
                const allMeetings = await fetchMeetings();
                const now = Date.now();

                // Find nearest upcoming meeting
                const upcoming = allMeetings
                    .filter(m => new Date(m.date_end).getTime() >= now)
                    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

                if (upcoming.length > 0) {
                    const nearest = upcoming[0];
                    setNextMeeting(nearest);

                    // Fetch sessions for this meeting using the specified key
                    const meetingSessions = await fetchSessions(nearest.meeting_key, nearest.year);

                    // Sort sessions chronologically
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

    // Format dates for display
    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDay = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

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

                    {/* Header: GP Name and Location - Dashboard Style */}
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
                                <Text className="text-lg font-black text-primary uppercase italic">{formatDay(nextMeeting.date_start).split(' ')[1]}</Text>
                                <Text className="text-[10px] text-white font-bold uppercase">{formatDay(nextMeeting.date_start).split(' ')[2]}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Body: Sessions Schedule - Tech List */}
                    <View className="gap-3">
                        {sessions.length > 0 ? (
                            sessions.map((session, index) => {
                                const isRace = session.session_type === 'Race' || session.session_name.toLowerCase().includes('race');
                                const isQuali = session.session_name.toLowerCase().includes('qualifying');

                                return (
                                    <View
                                        key={session.session_key}
                                        className={`flex-row items-center justify-between p-3.5 rounded-xl border ${isRace ? 'bg-primary/20 border-primary/40 shadow-lg' : 'bg-white/[0.03] border-white/5'}`}
                                    >
                                        <View className="flex-row items-center flex-1">
                                            <View className={`w-1 h-4 rounded-full mr-3 ${isRace ? 'bg-primary shadow-[0_0_8px_#ef4444]' : isQuali ? 'bg-orange-500' : 'bg-muted-foreground/30'}`} />
                                            <View>
                                                <Text className={`text-sm tracking-tight ${isRace ? 'font-black text-white uppercase italic' : 'font-bold text-muted-foreground/80'}`}>
                                                    {session.session_name}
                                                </Text>
                                                <Text className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-widest mt-0.5">
                                                    Section {index + 1}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center gap-4">
                                            <Text className="text-[10px] text-muted-foreground font-black uppercase tracking-widest text-right">
                                                {formatDay(session.date_start).split(' ')[0]}
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
                </BlurView>
            </View>
        </View>
    );
}
