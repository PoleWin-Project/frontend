import React, { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, Image, Pressable, Modal, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { X, Trophy, Globe, Hash, Calendar as CalendarIcon, ChevronRight } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { BlurView } from 'expo-blur';
import { fetchMeetings, fetchDriverStandings, fetchTeamStandings, MeetingItem, DriverStanding, TeamStanding } from '@/lib/api/meetings';
import { MeetingCard } from '@/components/calendar/MeetingCard';
import { TourGuideZone } from 'rn-tourguide';
import { useScreenTour } from '@/hooks/usePoleWinTour';
import { tourStep } from '@/lib/onboarding';

// Type guards
function isDriverStanding(item: any): item is DriverStanding {
    return (item as DriverStanding).driver_number !== undefined;
}

export default function ChampionshipScreen() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('calendar');
    const [subTab, setSubTab] = useState('drivers'); 
    const [calendarSubTab, setCalendarSubTab] = useState<'upcoming' | 'past'>('upcoming');

    const [meetings, setMeetings] = useState<MeetingItem[]>([]);
    const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
    const [teamStandings, setTeamStandings] = useState<TeamStanding[]>([]);

    const [selectedDriver, setSelectedDriver] = useState<DriverStanding | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<TeamStanding | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useScreenTour('championnat');

    const getTeamLogo = () => require('@/assets/images/placeholder_team.png');

    useEffect(() => {
        loadData();
    }, [activeTab, subTab]);

    async function loadData() {
        setLoading(true);
        try {
            if (activeTab === 'calendar' && meetings.length === 0) {
                const data = await fetchMeetings(2026);
                setMeetings(data);
            } else if (activeTab === 'f1') {
                if (subTab === 'drivers' && driverStandings.length === 0) {
                    const data = await fetchDriverStandings(2026);
                    setDriverStandings(data.sort((a, b) => a.position - b.position));
                } else if (subTab === 'teams' && teamStandings.length === 0) {
                    const data = await fetchTeamStandings(2026);
                    setTeamStandings(data.sort((a, b) => a.position - b.position));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Pull-to-refresh : force le refetch de l'onglet actif (ignore le cache de loadData)
    async function onRefresh() {
        setRefreshing(true);
        try {
            if (activeTab === 'calendar') {
                const data = await fetchMeetings(2026);
                setMeetings(data);
            } else if (subTab === 'drivers') {
                const data = await fetchDriverStandings(2026);
                setDriverStandings(data.sort((a, b) => a.position - b.position));
            } else {
                const data = await fetchTeamStandings(2026);
                setTeamStandings(data.sort((a, b) => a.position - b.position));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    }

    const upcomingMeetings = meetings.filter(m => new Date(m.date_end).getTime() >= Date.now())
        .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

    const pastMeetings = meetings.filter(m => new Date(m.date_end).getTime() < Date.now())
        .sort((a, b) => new Date(b.date_end).getTime() - new Date(a.date_end).getTime());

    const renderDetailModal = () => {
        const item = selectedDriver || selectedTeam;
        if (!item) return null;

        const isDriver = !!selectedDriver;
        const color = isDriver ? (selectedDriver?.driver?.team_colour || '333') : (selectedTeam?.team_colour || '333');
        const title = isDriver ? selectedDriver?.driver?.full_name : selectedTeam?.team_name;
        const subtitle = isDriver ? selectedDriver?.driver?.team_name : (selectedTeam?.nationality || 'Écurie F1');

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!item}
                onRequestClose={() => { setSelectedDriver(null); setSelectedTeam(null); }}
            >
                <View className="flex-1 justify-end bg-black/60">
                    <Pressable className="flex-1" onPress={() => { setSelectedDriver(null); setSelectedTeam(null); }} />
                    <View className="bg-[#0c0c0f] rounded-t-[40px] border-t border-white/10" style={{ height: '70%' }}>
                        <BlurView intensity={20} tint="dark" className="flex-1 p-6">
                            <View className="flex-row justify-between items-start mb-8">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-2">
                                        <View style={{ backgroundColor: `#${color}` }} className="w-3 h-3 rounded-full mr-2 shadow-lg" />
                                        <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">{isDriver ? 'Pilote Officiel' : 'Constructeur'}</Text>
                                    </View>
                                    <Text className="text-3xl font-black text-white uppercase italic">{title}</Text>
                                    <Text className="text-primary font-bold text-sm uppercase tracking-wider">{subtitle}</Text>
                                </View>
                                <TouchableOpacity onPress={() => { setSelectedDriver(null); setSelectedTeam(null); }} className="bg-white/5 p-2 rounded-full border border-white/10">
                                    <Icon as={X} size={20} className="text-white" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="flex-row mb-8 items-center bg-white/5 p-6 rounded-3xl border border-white/5">
                                    <View className="w-24 h-24 rounded-full bg-black/40 items-center justify-center border-2 border-white/10 mr-6">
                                        <Image 
                                            source={isDriver ? require('@/assets/images/placeholder_driver.png') : getTeamLogo()}
                                            className={isDriver ? "w-20 h-20 rounded-full" : "w-16 h-16"}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <View className="flex-1 gap-1">
                                        <View className="flex-row items-center justify-between border-b border-white/5 pb-2">
                                            <Text className="text-white/40 text-[10px] font-black uppercase">Position</Text>
                                            <Text className="text-white font-black text-xl italic">#{item.position}</Text>
                                        </View>
                                        <View className="flex-row items-center justify-between pt-2">
                                            <Text className="text-white/40 text-[10px] font-black uppercase">Points</Text>
                                            <Text className="text-primary font-black text-xl italic">{item.points} PTS</Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="flex-row flex-wrap justify-between gap-y-4">
                                     <View className="w-[48%] bg-white/5 p-4 rounded-2xl border border-white/5">
                                         <Icon as={Trophy} size={16} className="text-amber-400 mb-2" />
                                         <Text className="text-white/30 text-[9px] font-black uppercase mb-1">Victoires</Text>
                                         <Text className="text-white font-black text-lg italic">{item.wins || 0}</Text>
                                     </View>
                                     <View className="w-[48%] bg-white/5 p-4 rounded-2xl border border-white/5">
                                         <Icon as={Globe} size={16} className="text-blue-400 mb-2" />
                                         <Text className="text-white/30 text-[9px] font-black uppercase mb-1">Nationalité</Text>
                                         <Text className="text-white font-black text-sm uppercase">{isDriver ? selectedDriver?.driver?.nationality : selectedTeam?.nationality || 'N/A'}</Text>
                                     </View>
                                </View>
                                <TouchableOpacity className="bg-primary mt-8 py-4 rounded-2xl items-center shadow-lg shadow-primary/20" onPress={() => { setSelectedDriver(null); setSelectedTeam(null); }}>
                                    <Text className="text-white font-black uppercase tracking-widest italic" numberOfLines={1} adjustsFontSizeToFit>Fermer la télémétrie</Text>
                                </TouchableOpacity>
                                <View className="h-20" />
                            </ScrollView>
                        </BlurView>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View className="flex-1 bg-background">
            <ScreenHeader title="Championnat" subtitle="Saison Officielle 2026" />
            {renderDetailModal()}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <View className="mx-4 mt-4 border-b border-white/5">
                    <TabsList className="bg-transparent h-14">
                        <TourGuideZone
                            zone={1}
                            tourKey="championnat"
                            shape="rectangle"
                            style={{ flex: 1 }}
                            text={tourStep(1, 2, 'Le Calendrier 📅', 'Onglet Calendrier : retrouve tous les Grands Prix de la saison.')}
                        >
                            <TabsTrigger value="calendar" className="flex-1 flex-row gap-2">
                                <Icon as={CalendarIcon} size={14} className={activeTab === 'calendar' ? 'text-primary' : 'text-white/40'} />
                                <Text className={activeTab === 'calendar' ? 'text-white' : 'text-white/40'}>Calendrier</Text>
                            </TabsTrigger>
                        </TourGuideZone>
                        <TourGuideZone
                            zone={2}
                            tourKey="championnat"
                            shape="rectangle"
                            style={{ flex: 1 }}
                            text={tourStep(2, 2, 'Classement F1 🏆', 'Onglet Classement F1 : le championnat pilotes et écuries en direct.')}
                        >
                            <TabsTrigger value="f1" className="flex-1 flex-row gap-2">
                                <Icon as={Trophy} size={14} className={activeTab === 'f1' ? 'text-primary' : 'text-white/40'} />
                                <Text className={activeTab === 'f1' ? 'text-white' : 'text-white/40'}>Classement F1</Text>
                            </TabsTrigger>
                        </TourGuideZone>
                    </TabsList>
                </View>

                {/* --- CALENDAR TAB --- */}
                <TabsContent value="calendar" className="flex-1">
                    <View className="flex-row px-4 py-3 gap-2">
                        <TouchableOpacity onPress={() => setCalendarSubTab('upcoming')} className={`px-4 py-2 rounded-full border ${calendarSubTab === 'upcoming' ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10'}`}>
                            <Text className={`text-xs font-bold ${calendarSubTab === 'upcoming' ? 'text-primary' : 'text-white/40'}`}>Suivants</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCalendarSubTab('past')} className={`px-4 py-2 rounded-full border ${calendarSubTab === 'past' ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10'}`}>
                            <Text className={`text-xs font-bold ${calendarSubTab === 'past' ? 'text-primary' : 'text-white/40'}`}>Passés</Text>
                        </TouchableOpacity>
                    </View>

                    {loading && meetings.length === 0 ? <ActivityIndicator className="mt-20" color="#ef1f14" /> : (
                        <FlatList
                            data={calendarSubTab === 'upcoming' ? upcomingMeetings : pastMeetings}
                            keyExtractor={(item) => item.meeting_key.toString()}
                            renderItem={({ item }) => <MeetingCard meeting={item} isPast={new Date(item.date_end).getTime() < Date.now()} />}
                            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef1f14" />}
                        />
                    )}
                </TabsContent>

                {/* --- F1 STANDINGS TAB --- */}
                <TabsContent value="f1" className="flex-1">
                    <View className="flex-row px-4 py-3 gap-2">
                        <TouchableOpacity onPress={() => setSubTab('drivers')} className={`px-4 py-2 rounded-full border ${subTab === 'drivers' ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10'}`}>
                            <Text className={`text-xs font-bold ${subTab === 'drivers' ? 'text-primary' : 'text-white/40'}`}>Pilotes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSubTab('teams')} className={`px-4 py-2 rounded-full border ${subTab === 'teams' ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10'}`}>
                            <Text className={`text-xs font-bold ${subTab === 'teams' ? 'text-primary' : 'text-white/40'}`}>Écuries</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#ef1f14" />
                        </View>
                    ) : (
                        subTab === 'drivers' ? (
                            <FlatList
                                data={driverStandings}
                                keyExtractor={(item) => item.driver_number.toString()}
                                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef1f14" />}
                                renderItem={({ item }) => {
                                    const d = item.driver;
                                    const tColor = d?.team_colour || '333';
                                    return (
                                        <Pressable 
                                            onPress={() => setSelectedDriver(item)}
                                            className="flex-row items-center py-4 bg-[#0c0c0f] mb-3 px-4 rounded-2xl border border-white/5"
                                        >
                                            <View className="w-8">
                                                <Text className={`font-black text-lg italic ${item.position <= 3 ? 'text-primary' : 'text-white/40'}`}>#{item.position}</Text>
                                            </View>
                                            <View style={{ width: 4, height: 32, backgroundColor: `#${tColor}`, borderRadius: 2, marginRight: 12 }} />
                                            <View className="flex-1">
                                                <Text className="text-white font-black text-sm uppercase italic" numberOfLines={1}>{d?.full_name}</Text>
                                                <Text className="text-white/40 text-[10px] font-bold uppercase">{d?.team_name}</Text>
                                            </View>
                                            <View className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                                <Text className="text-primary font-black text-xs italic">{item.points} PTS</Text>
                                            </View>
                                        </Pressable>
                                    );
                                }}
                            />
                        ) : (
                            <FlatList
                                data={teamStandings}
                                keyExtractor={(item) => item.team_name}
                                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef1f14" />}
                                renderItem={({ item }) => {
                                    const tColor = item.team_colour || '333';
                                    return (
                                        <Pressable 
                                            onPress={() => setSelectedTeam(item)}
                                            className="flex-row items-center py-4 bg-[#0c0c0f] mb-3 px-4 rounded-2xl border border-white/5"
                                        >
                                            <View className="w-8">
                                                <Text className={`font-black text-lg italic ${item.position <= 3 ? 'text-primary' : 'text-white/40'}`}>#{item.position}</Text>
                                            </View>
                                            <View style={{ width: 4, height: 32, backgroundColor: `#${tColor}`, borderRadius: 2, marginRight: 12 }} />
                                            <View className="flex-1">
                                                <Text className="text-white font-black text-sm uppercase italic" numberOfLines={1}>{item.team_name}</Text>
                                                <Text className="text-white/40 text-[10px] font-bold uppercase">Écurie F1</Text>
                                            </View>
                                            <View className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                                <Text className="text-primary font-black text-xs italic">{item.points} PTS</Text>
                                            </View>
                                        </Pressable>
                                    );
                                }}
                            />
                        )
                    )}
                </TabsContent>
            </Tabs>
        </View>
    );
}
