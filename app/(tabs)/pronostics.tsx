import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { Calendar, MapPin, Info, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock } from 'lucide-react-native';
import { fetchRaceSessions, RaceSession, fetchPredictions, Prediction, fetchMyPronostic, Pronostic, fetchDrivers, Driver, fetchMyPronosticsForSession, fetchMyPronosticsHistory, fetchMeetings, MeetingItem } from '@/lib/api/meetings';
import { PredictionCard } from '@/components/game/PredictionCard';
import { PronosticHistoryCard } from '@/components/game/PronosticHistoryCard';
import { DemoModeCard } from '@/components/game/DemoModeCard';
import { DemoPredictionCard } from '@/components/game/DemoPredictionCard';
import { useDemo } from '@/context/DemoContext';
import { CircuitTrack } from '@/components/calendar/CircuitTrack';
import { getCircuitTrack } from '@/lib/circuits';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { F1Loader } from '@/components/ui/F1Loader';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { GuestPrompt } from '@/components/ui/GuestPrompt';
import { TourGuideZone } from 'rn-tourguide';
import { useScreenTour } from '@/hooks/usePoleWinTour';
import { tourStep } from '@/lib/onboarding';

export default function PronosticsScreen() {
    const { user, refreshProfile } = useAuth();

    useScreenTour('pronostics');

    const demo = useDemo();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [upcomingSessions, setUpcomingSessions] = useState<RaceSession[]>([]);
    const [predictionsMap, setPredictionsMap] = useState<Record<number, Prediction[]>>({});
    const [pronosticsMap, setPronosticsMap] = useState<Record<number, Pronostic | null>>({});
    const [driversMap, setDriversMap] = useState<Record<number, Driver[]>>({});
    const [meetings, setMeetings] = useState<MeetingItem[]>([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [history, setHistory] = useState<Pronostic[]>([]);
    const [historyFilter, setHistoryFilter] = useState<'ALL' | 'WON' | 'LOST' | 'PENDING'>('ALL');
    const [expandedGPs, setExpandedGPs] = useState<string[]>([]);

    const filteredHistory = history.filter(prono => {
        if (historyFilter === 'ALL') return true;
        if (historyFilter === 'WON') return prono.status === 'won';
        if (historyFilter === 'LOST') return prono.status === 'lost';
        if (historyFilter === 'PENDING') return prono.status === 'submitted';
        return true;
    });

    const groupedHistory = filteredHistory.reduce((acc, prono) => {
        const prediction = prono.prediction as any;
        const country = prediction?.session?.name ? prediction.session.name.split(' - ')[0] : 'Autres';
        const city = prediction?.session?.location;
        const sessionName = city && country !== 'Autres' ? `${country} - ${city}` : country;
        if (!acc[sessionName]) acc[sessionName] = [];
        acc[sessionName].push(prono);
        return acc;
    }, {} as Record<string, Pronostic[]>);

    const toggleGP = (gp: string) => {
        setExpandedGPs(prev => prev.includes(gp) ? prev.filter(g => g !== gp) : [...prev, gp]);
    };

    // Extrait le vrai nom de session depuis le format "{pays} - {session_name}"
    // ou retombe sur le champ `type`. Permet d'ignorer un `type` corrompu en DB.
    const realSessionName = (s: RaceSession): string => {
        if (s.name && s.name.includes(' - ')) {
            const parts = s.name.split(' - ');
            return parts[parts.length - 1].trim();
        }
        return s.type;
    };

    const loadData = async () => {
        if (!user) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        setLoading(true);
        try {
            const sessions = await fetchRaceSessions(50, true);
            const ALLOWED = ['Race', 'Qualifying', 'Sprint'];
            // On dédoublonne par (vrai nom + dateStart) au cas où la DB aurait des rows redondants
            const seen = new Set<string>();
            const allNextSessions = sessions
                .filter(s => ALLOWED.includes(realSessionName(s)))
                .filter(s => {
                    const key = `${realSessionName(s)}|${s.dateStart}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            
            let nextSessions: RaceSession[] = [];
            if (allNextSessions.length > 0) {
                const firstSession = allNextSessions[0];
                const gpName = firstSession.name ? firstSession.name.split(' - ')[0] : '';
                const gpLocation = firstSession.location || '';
                
                nextSessions = allNextSessions
                    .filter(s => {
                        const sGpName = s.name ? s.name.split(' - ')[0] : '';
                        const sLocation = s.location || '';
                        return (!gpName || sGpName === gpName) && (!gpLocation || sLocation === gpLocation);
                    })
                    .slice(0, 3)
                    .map(s => ({ ...s, type: realSessionName(s) }));
            }

            setUpcomingSessions(nextSessions);

            const preds: Record<number, Prediction[]> = {};
            const prons: Record<number, Pronostic | null> = {};
            const drvs: Record<number, Driver[]> = {};

            for (const session of nextSessions) {
                const sessionPredictions = await fetchPredictions(session.id);
                preds[session.id] = sessionPredictions;

                const drivers = await fetchDrivers(session.idCourseExternal);
                drvs[session.id] = drivers;

                const myPronostics = await fetchMyPronosticsForSession(session.id);
                for (const p of myPronostics) {
                    prons[p.predictionId] = p;
                }
            }

            setPredictionsMap(preds);
            setPronosticsMap(prons);
            setDriversMap(drvs);

            const hist = await fetchMyPronosticsHistory();
            setHistory(hist);
            const mtgs = await fetchMeetings();
            setMeetings(mtgs);
            await refreshProfile().catch(() => {});
        } catch (error) {
            console.error('Failed to load game data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (!user) {
        return <GuestPrompt title="Pronostics" description="Connecte-toi pour parier sur les prochaines courses et défier tes amis !" />;
    }

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <F1Loader />
            </View>
        );
    }

    const nextGP = upcomingSessions[0];
    const nextGPMeeting = nextGP ? meetings.find(m => m.location === nextGP.location || nextGP.name.includes(m.meeting_name)) : null;
    const track = nextGPMeeting ? getCircuitTrack(nextGPMeeting) : null;
    const circuitImage = nextGPMeeting?.circuit_image || '';

    return (
        <View className="flex-1 bg-background">
            <ScreenHeader title="Pronos Win" subtitle="Sessions & Paris" showPoints={true} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <View className="mx-4 mt-4 mb-2">
                    <TabsList className="flex-row">
                        <TourGuideZone
                            zone={1}
                            tourKey="pronostics"
                            shape="rectangle"
                            style={{ flex: 1 }}
                            text={tourStep(1, 2, 'Fais ton prono 🎯', 'Onglet « À venir » : avant chaque course, tente de deviner le Top 3.')}
                        >
                            <TabsTrigger value="upcoming" className="flex-1">
                                <Text>À venir</Text>
                            </TabsTrigger>
                        </TourGuideZone>
                        <TourGuideZone
                            zone={2}
                            tourKey="pronostics"
                            shape="rectangle"
                            style={{ flex: 1 }}
                            text={tourStep(2, 2, 'Ton historique 📊', 'Onglet « Historique » : tes anciens pronos et les points gagnés.')}
                        >
                            <TabsTrigger value="history" className="flex-1">
                                <Text>Historique</Text>
                            </TabsTrigger>
                        </TourGuideZone>
                    </TabsList>
                </View>

                <TabsContent value="upcoming" className="flex-1">
                    <ScrollView
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="px-4 pt-4">
                            <DemoModeCard />
                            {demo.active && <DemoPredictionCard />}
                        </View>
                        {nextGP ? (
                            <View className="p-4 pt-0">
                                {/* Next GP Hero */}
                                <View className="bg-zinc-900 rounded-3xl overflow-hidden mb-6 border border-white/5 shadow-2xl relative">
                                        {track ? (
                                            <View className="absolute right-[-10px] top-[16px] opacity-80" pointerEvents="none">
                                                <CircuitTrack points={track.points} width={160} height={160} color="white" strokeWidth={3} isAnimated={true} animatedColor="#39ff14" />
                                            </View>
                                        ) : circuitImage ? (
                                        <Image 
                                            source={{ uri: circuitImage }} 
                                            className="absolute right-[-30px] bottom-[-10px] w-56 h-56 opacity-20" 
                                            resizeMode="contain"
                                            style={{ tintColor: 'white' }}
                                        />
                                    ) : null}
                                    <View className="p-6 h-48 justify-between bg-black/40">
                                        <View className="flex-row justify-between items-start">
                                            <View className="bg-primary px-3 py-1 rounded-sm">
                                                <Text className="text-[10px] font-black uppercase text-white">Prochain Event</Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-white/60 text-xs font-bold uppercase tracking-widest">Saison 2026</Text>
                                            </View>
                                        </View>
                                        <View>
                                            <Text className="text-3xl font-black text-white uppercase italic leading-none mb-1">
                                                {nextGP.name.split(' - ')[0]}
                                            </Text>
                                            <View className="flex-row items-center">
                                                <MapPin size={14} color="#ef4444" />
                                                <Text className="text-white/80 text-sm font-medium ml-1">
                                                    {nextGP.location || nextGP.name.split(' - ')[0]}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Sessions & Predictions */}
                                <Text className="text-xs font-black text-muted-foreground uppercase tracking-[4px] mb-4 px-2">Sessions à venir</Text>

                                {upcomingSessions.map(session => (
                                    <View key={session.id} className="mb-8">
                                        <View className="flex-row items-center mb-4 px-2">
                                            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 border border-primary/20">
                                                <Calendar size={16} color="#ef4444" />
                                            </View>
                                            <View>
                                                <Text className="text-base font-black text-foreground uppercase italic">{session.type}</Text>
                                                <Text className="text-[10px] text-muted-foreground font-bold uppercase">
                                                    {session.location ? `${session.location} • ` : ''}
                                                    {new Date(session.dateStart).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </Text>
                                            </View>
                                        </View>

                                        {(() => {
                                            const allowed = ['POLE_POSITION', 'RACE_WINNER', 'SPRINT_WINNER', 'PODIUM', 'DNF', 'SAFETY_CAR', 'FASTEST_LAP'];
                                            const visible = (predictionsMap[session.id] || []).filter(p => allowed.includes(p.type));
                                            return visible.length > 0 ? (
                                                <ScrollView 
                                                    horizontal 
                                                    showsHorizontalScrollIndicator={false}
                                                    className="-mx-4"
                                                    contentContainerStyle={{ paddingHorizontal: 16 }}
                                                    snapToInterval={316}
                                                    decelerationRate="fast"
                                                >
                                                    {visible.map((prediction, index) => (
                                                        <View key={prediction.id} style={{ width: 300, marginRight: index === visible.length - 1 ? 0 : 16 }}>
                                                            <PredictionCard
                                                                prediction={prediction}
                                                                drivers={driversMap[session.id] || []}
                                                                initialPronostic={pronosticsMap[prediction.id] || null}
                                                                onRefresh={loadData}
                                                            />
                                                        </View>
                                                    ))}
                                                </ScrollView>
                                            ) : (
                                                <View className="bg-card/50 border border-border/20 rounded-2xl p-6 items-center border-dashed">
                                                    <Info size={24} color="#9ca3af" className="mb-2" />
                                                    <Text className="text-muted-foreground text-center text-xs font-medium">
                                                        Aucun pronostic disponible pour cette session.
                                                    </Text>
                                                </View>
                                            );
                                        })()}
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View className="flex-1 items-center justify-center p-12 mt-20">
                                <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
                                    <Info size={32} color="#9ca3af" />
                                </View>
                                <Text className="text-lg font-bold text-foreground mb-2 text-center">Pas d'événement détecté</Text>
                                <Text className="text-muted-foreground text-center text-sm">
                                    Le calendrier F1 est en cours de mise à jour. Revenez bientôt !
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </TabsContent>
                <TabsContent value="history" className="flex-1">
                    <View className="flex-row px-4 mt-2 mb-4 gap-2">
                        {['ALL', 'WON', 'LOST', 'PENDING'].map((filter) => {
                            const labels: Record<string, string> = { ALL: 'Tous', WON: 'Gagnés', LOST: 'Perdus', PENDING: 'En cours' };
                            const isActive = historyFilter === filter;
                            return (
                                <TouchableOpacity 
                                    key={filter}
                                    onPress={() => setHistoryFilter(filter as any)}
                                    className={`px-3 py-1.5 rounded-full border ${isActive ? 'bg-primary/20 border-primary' : 'bg-muted/20 border-border/50'}`}
                                >
                                    <Text className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {labels[filter]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <ScrollView
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 16, paddingBottom: 40, paddingTop: 0 }}
                    >
                        {Object.keys(groupedHistory).length > 0 ? (
                            Object.entries(groupedHistory).map(([gpName, pronos]) => {
                                const isExpanded = expandedGPs.includes(gpName);
                                const wonCount = pronos.filter(p => p.status === 'won').length;
                                return (
                                    <View key={gpName} className="mb-4">
                                        <TouchableOpacity 
                                            onPress={() => toggleGP(gpName)}
                                            className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex-row items-center justify-between"
                                        >
                                            <View className="flex-row items-center flex-1">
                                                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3 border border-primary/20">
                                                    <MapPin size={18} color="#ef4444" />
                                                </View>
                                                <View>
                                                    <Text className="text-base font-black text-white uppercase italic">{gpName}</Text>
                                                    <Text className="text-xs text-muted-foreground font-bold uppercase">{pronos.length} paris • {wonCount} gagnés</Text>
                                                </View>
                                            </View>
                                            {isExpanded ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
                                        </TouchableOpacity>
                                        
                                        {isExpanded && (
                                            <View className="mt-3 pl-2 pr-1">
                                                {pronos.map(prono => (
                                                    <PronosticHistoryCard key={prono.id} pronostic={prono} />
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        ) : (
                            <View className="flex-1 items-center justify-center p-12 mt-10">
                                <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
                                    <Info size={32} color="#9ca3af" />
                                </View>
                                <Text className="text-lg font-bold text-foreground mb-2 text-center">Aucun pronostic</Text>
                                <Text className="text-muted-foreground text-center text-sm">
                                    {historyFilter === 'ALL' 
                                        ? "Vous n'avez pas encore fait de pronostics." 
                                        : "Aucun pronostic ne correspond à ce filtre."}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </TabsContent>
            </Tabs>
        </View>
    );
}
