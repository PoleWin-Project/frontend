import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { View, Image, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Clock, Calendar as CalendarIcon, Trophy } from 'lucide-react-native';
import { fetchSessions, SessionItem, fetchSessionResults, SessionResult } from '@/lib/api/meetings';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MeetingDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();

    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sessions');

    useEffect(() => {
        async function loadData() {
            try {
                if (params.id && params.year) {
                    const data = await fetchSessions(Number(params.id), Number(params.year));
                    setSessions(data.sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [params.id, params.year]);

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDay = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <View className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* Custom Header */}
            <SafeAreaView edges={['top']} className="bg-card border-b border-border/50 shadow-sm">
                <View className="flex-row items-center px-4 pt-2 pb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                        <ArrowLeft size={24} className="text-foreground" color="#9ca3af" />
                    </TouchableOpacity>
                    <View className="flex-row items-center flex-1">
                        {params.country_flag ? (
                            <Image
                                source={{ uri: params.country_flag as string }}
                                className="w-8 h-5 rounded-sm mr-3"
                                resizeMode="cover"
                            />
                        ) : null}
                        <Text className="font-heading text-xl font-bold text-foreground" numberOfLines={1}>
                            {params.meeting_name}
                        </Text>
                    </View>
                </View>
            </SafeAreaView>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <View className="px-4 py-3 bg-card border-b border-border/10 shadow-sm z-10">
                    <TabsList className="flex-row">
                        <TabsTrigger value="sessions" className="flex-1">
                            <Text>Sessions</Text>
                        </TabsTrigger>
                        <TabsTrigger value="circuit" className="flex-1">
                            <Text>Circuit</Text>
                        </TabsTrigger>
                        <TabsTrigger value="general" className="flex-1">
                            <Text>Général</Text>
                        </TabsTrigger>
                    </TabsList>
                </View>

                <TabsContent value="sessions" className="flex-1 bg-muted/20">
                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1 p-4">
                        {loading ? (
                            <ActivityIndicator size="large" className="text-primary mt-10" />
                        ) : sessions.length > 0 ? (
                            <View className="bg-card border border-border/50 rounded-xl p-4 shadow-sm mb-8">
                                {sessions.map((session, index) => (
                                    <SessionDetailItem
                                        key={session.session_key}
                                        session={session}
                                        isLast={index === sessions.length - 1}
                                        formatDay={formatDay}
                                        formatTime={formatTime}
                                    />
                                ))}
                            </View>
                        ) : (
                            <View className="items-center justify-center mt-10 opacity-70">
                                <CalendarIcon size={48} className="text-muted-foreground mb-4 opacity-50" color="#9ca3af" />
                                <Text className="text-center text-muted-foreground">Aucune session enregistrée pour ce Grand Prix.</Text>
                            </View>
                        )}
                    </ScrollView>
                </TabsContent>

                <TabsContent value="circuit" className="flex-1 p-4 bg-muted/20">
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className="bg-card border border-border/50 rounded-xl p-6 shadow-sm mb-6 items-center">
                            <Text className="font-heading text-xl font-bold text-foreground mb-1 text-center">
                                {params.circuit_short_name}
                            </Text>
                            <View className="flex-row items-center mb-8">
                                <MapPin size={14} className="text-primary mr-1 flex-shrink-0" color="#ef4444" />
                                <Text className="text-sm text-muted-foreground">{params.location}, {params.country_name}</Text>
                            </View>

                            {params.circuit_image ? (
                                <View className="w-full flex-row justify-center py-6 bg-muted/30 rounded-lg border border-border/40">
                                    <Image
                                        source={{ uri: params.circuit_image as string }}
                                        style={{ width: '100%', height: 220 }}
                                        resizeMode="contain"
                                        tintColor="#9ca3af" // gris stylé
                                    />
                                </View>
                            ) : (
                                <View className="h-40 w-full items-center justify-center bg-muted rounded-lg border border-border border-dashed">
                                    <Text className="text-muted-foreground">Image du circuit indisponible</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </TabsContent>

                <TabsContent value="general" className="flex-1 p-4 bg-muted/20">
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className="bg-card border border-border/50 rounded-xl p-6 shadow-sm mb-4">
                            <Text className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Informations Officielles</Text>
                            <Text className="text-lg font-bold text-foreground mb-4">{params.meeting_official_name}</Text>

                            <View className="space-y-4">
                                <View className="flex-row justify-between items-center py-2 border-b border-border/30">
                                    <Text className="text-muted-foreground">Pays</Text>
                                    <Text className="font-medium text-foreground">{params.country_name}</Text>
                                </View>
                                <View className="flex-row justify-between items-center py-2 border-b border-border/30">
                                    <Text className="text-muted-foreground">Ville</Text>
                                    <Text className="font-medium text-foreground">{params.location}</Text>
                                </View>
                                <View className="flex-row justify-between items-center py-2 border-b border-border/30">
                                    <Text className="text-muted-foreground">Saison</Text>
                                    <Text className="font-medium text-foreground">{params.year}</Text>
                                </View>
                                <View className="flex-row justify-between items-center py-2">
                                    <Text className="text-muted-foreground">Fuseau Horaire (GMT)</Text>
                                    <Text className="font-medium text-foreground">{params.gmt_offset}</Text>
                                </View>
                            </View>
                        </View>

                        <View className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                            <Text className="text-xs text-primary font-bold uppercase mb-1">Note</Text>
                            <Text className="text-sm text-foreground/80 italic leading-snug">
                                Les horaires des sessions sont automatiquement convertis à l'heure locale de votre appareil.
                            </Text>
                        </View>
                    </ScrollView>
                </TabsContent>
            </Tabs>
        </View>
    );
}

function SessionDetailItem({ session, isLast, formatDay, formatTime }: {
    session: SessionItem;
    isLast: boolean;
    formatDay: (date: string) => string;
    formatTime: (date: string) => string;
}) {
    const [results, setResults] = useState<SessionResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const formatLapTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(3);
        return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`;
    };

    const isRace = session.session_type === 'Race' || session.session_name.toLowerCase().includes('race');
    const isQuali = session.session_name.toLowerCase().includes('qualifying');
    const isPast = new Date(session.date_end).getTime() < Date.now();

    const fetchResults = async () => {
        if (loading || results.length > 0) {
            setShowResults(!showResults);
            return;
        }
        setLoading(true);
        try {
            const data = await fetchSessionResults(session.session_key);
            setResults(data);
            setShowResults(true);
        } catch (error) {
            console.error("Failed to load session results:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className={`py-4 ${!isLast ? 'border-b border-border/30' : ''} ${isRace ? 'bg-primary/5 -mx-4 px-4 rounded-lg' : ''}`}>
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-2">
                    <View className={`w-2.5 h-2.5 rounded-full mr-3 ${isRace ? 'bg-primary' : isQuali ? 'bg-orange-500' : 'bg-muted-foreground/40'}`} />
                    <Text className={`text-base flex-1 ${isRace ? 'font-bold text-foreground' : 'font-medium text-foreground'}`} numberOfLines={1}>
                        {session.session_name}
                    </Text>
                </View>

                <View className="flex-row items-center ml-2">
                    <Text className="text-xs text-muted-foreground mr-3 capitalize text-right">
                        {formatDay(session.date_start)}
                    </Text>
                    <View className={`bg-background/80 border ${isRace ? 'border-primary/40' : 'border-border/60'} px-2 py-0.5 rounded-md flex-row items-center justify-center shadow-xs`}>
                        <Text className={`text-sm font-mono font-bold ${isRace ? 'text-primary' : 'text-foreground'}`}>
                            {formatTime(session.date_start)}
                        </Text>
                    </View>
                </View>
            </View>

            {isPast && (
                <View className="mt-3">
                    <TouchableOpacity
                        onPress={fetchResults}
                        activeOpacity={0.7}
                        className="flex-row items-center gap-2"
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#ef4444" style={{ transform: [{ scale: 0.8 }] }} />
                        ) : (
                            <Trophy size={14} color={showResults ? "#ef4444" : "gray"} />
                        )}
                        <Text className={`text-xs font-bold uppercase tracking-widest ${showResults ? 'text-primary' : 'text-muted-foreground'}`}>
                            {showResults ? 'Masquer les résultats' : 'Voir les résultats'}
                        </Text>
                    </TouchableOpacity>

                    {showResults && results.length > 0 && (
                        <View className="mt-3 gap-2 bg-muted/40 p-4 rounded-xl border border-border/50">
                            {results.map((res) => (
                                <View key={res.driver_number} className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <Text className="text-xs font-mono font-bold text-muted-foreground w-8">
                                            P{res.position}
                                        </Text>
                                        {res.driver?.team_colour && (
                                            <View style={{ width: 3, height: 12, backgroundColor: `#${res.driver.team_colour}`, borderRadius: 1 }} />
                                        )}
                                        <View>
                                            <Text className="text-sm font-bold text-foreground">
                                                {res.driver?.full_name || res.driver_number}
                                            </Text>
                                            <Text className="text-[10px] text-muted-foreground uppercase">
                                                {res.driver?.team_name}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        {res.time ? (
                                            <Text className="text-sm font-mono font-bold text-foreground">
                                                {formatLapTime(res.time)}
                                            </Text>
                                        ) : (
                                            <Text className="text-sm font-mono font-bold text-primary">
                                                {res.driver?.name_acronym}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

