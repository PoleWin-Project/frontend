import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Calendar, MapPin, ChevronRight, Info } from 'lucide-react-native';
import { fetchRaceSessions, RaceSession, fetchPredictions, Prediction, fetchMyPronostic, Pronostic, fetchDrivers, Driver, fetchMyPronosticsForSession, fetchMyPronosticsHistory } from '@/lib/api/meetings';
import { PredictionCard } from '@/components/game/PredictionCard';
import { PronosticHistoryCard } from '@/components/game/PronosticHistoryCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { F1Loader } from '@/components/ui/F1Loader';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';

export default function GameScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [upcomingSessions, setUpcomingSessions] = useState<RaceSession[]>([]);
    const [predictionsMap, setPredictionsMap] = useState<Record<number, Prediction[]>>({});
    const [pronosticsMap, setPronosticsMap] = useState<Record<number, Pronostic | null>>({});
    const [driversMap, setDriversMap] = useState<Record<number, Driver[]>>({});
    const [activeTab, setActiveTab] = useState('upcoming');
    const [history, setHistory] = useState<Pronostic[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const sessions = await fetchRaceSessions(50);
            // Sort by date and filter for upcoming or very recent
            const sorted = sessions
                .filter(s => ['Race', 'Qualifying', 'Sprint'].includes(s.type))
                .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
            
            // Find the next 3 sessions with predictions
            const nextSessions = sorted.filter(s => new Date(s.dateStart).getTime() > Date.now() - 3600000).slice(0, 3);
            setUpcomingSessions(nextSessions);

            // Fetch predictions and drivers for each session
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

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <F1Loader />
            </View>
        );
    }

    const nextGP = upcomingSessions[0];

    return (
        <View className="flex-1 bg-background">
            <ScreenHeader title="Pronos Win" subtitle="Sessions & Paris" showPoints={true} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <View className="mx-4 mt-4 mb-2">
                    <TabsList className="flex-row">
                        <TabsTrigger value="upcoming" className="flex-1">
                            <Text>À venir</Text>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex-1">
                            <Text>Historique</Text>
                        </TabsTrigger>
                    </TabsList>
                </View>

                <TabsContent value="upcoming" className="flex-1">
                    <ScrollView 
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}
                        showsVerticalScrollIndicator={false}
                    >
                        {nextGP ? (
                            <View className="p-4">
                        {/* Next GP Hero */}
                        <View className="bg-zinc-900 rounded-3xl overflow-hidden mb-6 border border-white/5 shadow-2xl">
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

                                {predictionsMap[session.id]?.length > 0 ? (
                                    predictionsMap[session.id].map(prediction => (
                                        <PredictionCard 
                                            key={prediction.id}
                                            prediction={prediction}
                                            drivers={driversMap[session.id] || []}
                                            initialPronostic={pronosticsMap[prediction.id] || null}
                                            onRefresh={loadData}
                                        />
                                    ))
                                ) : (
                                    <View className="bg-card/50 border border-border/20 rounded-2xl p-6 items-center border-dashed">
                                        <Info size={24} color="#9ca3af" className="mb-2" />
                                        <Text className="text-muted-foreground text-center text-xs font-medium">
                                            Aucun pronostic disponible pour cette session.
                                        </Text>
                                    </View>
                                )}
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
            <ScrollView 
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            >
                {history.length > 0 ? (
                    history.map(prono => (
                        <PronosticHistoryCard key={prono.id} pronostic={prono} />
                    ))
                ) : (
                    <View className="flex-1 items-center justify-center p-12 mt-20">
                        <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
                            <Info size={32} color="#9ca3af" />
                        </View>
                        <Text className="text-lg font-bold text-foreground mb-2 text-center">Aucun pronostic</Text>
                        <Text className="text-muted-foreground text-center text-sm">
                            Vous n'avez pas encore fait de pronostics.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </TabsContent>
    </Tabs>
</View>
    );
}