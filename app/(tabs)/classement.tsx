import { View, FlatList, ActivityIndicator, Image, Pressable, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { useState, useEffect } from 'react';
import { fetchDriverStandings, fetchTeamStandings, DriverStanding, TeamStanding } from '@/lib/api/meetings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { X, Trophy, Globe, Hash, PieChart, Star } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function StandingsScreen() {
    const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
    const [teamStandings, setTeamStandings] = useState<TeamStanding[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('drivers');
    
    const [selectedDriver, setSelectedDriver] = useState<DriverStanding | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<TeamStanding | null>(null);

    const getTeamLogo = () => require('@/assets/images/placeholder_team.png');

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                if (activeTab === 'drivers') {
                    const data = await fetchDriverStandings(2026);
                    setDriverStandings(data.sort((a, b) => a.position - b.position));
                } else {
                    const data = await fetchTeamStandings(2026);
                    setTeamStandings(data.sort((a, b) => a.position - b.position));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [activeTab]);

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
                onRequestClose={() => {
                    setSelectedDriver(null);
                    setSelectedTeam(null);
                }}
            >
                <View className="flex-1 justify-end bg-black/60">
                    <Pressable className="flex-1" onPress={() => { setSelectedDriver(null); setSelectedTeam(null); }} />
                    <View className="bg-[#0c0c0f] rounded-t-[40px] border-t border-white/10" style={{ height: '70%' }}>
                        <BlurView intensity={20} tint="dark" className="flex-1 p-6">
                            {/* Header */}
                            <View className="flex-row justify-between items-start mb-8">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-2">
                                        <View style={{ backgroundColor: `#${color}` }} className="w-3 h-3 rounded-full mr-2 shadow-lg" />
                                        <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">{isDriver ? 'Pilote Officiel' : 'Constructeur'}</Text>
                                    </View>
                                    <Text className="text-3xl font-black text-white uppercase italic">{title}</Text>
                                    <Text className="text-primary font-bold text-sm uppercase tracking-wider">{subtitle}</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => { setSelectedDriver(null); setSelectedTeam(null); }}
                                    className="bg-white/5 p-2 rounded-full border border-white/10"
                                >
                                    <Icon as={X} size={20} className="text-white" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Image & Main Stats */}
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

                                {/* Detailed Grid */}
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
                                    {isDriver && (
                                        <View className="w-[48%] bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <Icon as={Hash} size={16} className="text-primary mb-2" />
                                            <Text className="text-white/30 text-[9px] font-black uppercase mb-1">Numéro</Text>
                                            <Text className="text-white font-black text-lg italic">{selectedDriver?.driver_number}</Text>
                                        </View>
                                    )}
                                    <View className="w-[48%] bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <Icon as={Star} size={16} className="text-red-500 mb-2" />
                                        <Text className="text-white/30 text-[9px] font-black uppercase mb-1">Status</Text>
                                        <Text className="text-white font-black text-sm uppercase">Actif 2026</Text>
                                    </View>
                                </View>

                                {/* Footer CTA */}
                                <TouchableOpacity 
                                    className="bg-primary mt-8 py-4 rounded-2xl items-center shadow-lg shadow-primary/20"
                                    onPress={() => { setSelectedDriver(null); setSelectedTeam(null); }}
                                >
                                    <Text className="text-white font-black uppercase tracking-widest italic">Fermer la télémétrie</Text>
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
            <ScreenHeader title="Classement F1" subtitle="Championnat du Monde" />
            
            {renderDetailModal()}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                {/* Custom Tabs List */}
                <View className="mx-4 mt-4 mb-2">
                    <TabsList className="flex-row">
                        <TabsTrigger value="drivers" className="flex-1">
                            <Text>Pilotes</Text>
                        </TabsTrigger>
                        <TabsTrigger value="teams" className="flex-1">
                            <Text>Écuries</Text>
                        </TabsTrigger>
                    </TabsList>
                </View>

                {/* Driver Standings Content */}
                <TabsContent value="drivers" className="flex-1">
                    {loading && driverStandings.length === 0 ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#E10600" />
                        </View>
                    ) : (
                        <FlatList
                            data={driverStandings}
                            keyExtractor={(item) => item.driver_number.toString()}
                            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                            renderItem={({ item }) => (
                                <Pressable 
                                    onPress={() => setSelectedDriver(item)}
                                    className="flex-row items-center py-4 border-b border-border/30 bg-card mb-2 px-4 rounded-xl active:bg-white/5"
                                >
                                    <View className="w-8">
                                        <Text className={`font-mono font-bold text-lg ${item.position <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {item.position}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center flex-1">
                                        <View style={{ width: 4, height: 36, backgroundColor: item.driver?.team_colour ? `#${item.driver.team_colour}` : '#333', borderRadius: 2, marginRight: 12 }} />

                                        <Image
                                            source={require('@/assets/images/placeholder_driver.png')}
                                            className="w-12 h-12 rounded-full mr-3 bg-muted"
                                            resizeMode="cover"
                                        />

                                        <View className="flex-1">
                                            <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
                                                {item.driver?.full_name || `Driver #${item.driver_number}`}
                                            </Text>
                                            <View className="flex-row items-center mt-0.5">
                                                {item.driver?.team_name && (
                                                    <Image
                                                        source={getTeamLogo()}
                                                        className="w-4 h-4 mr-1.5"
                                                        resizeMode="contain"
                                                    />
                                                )}
                                                <Text className="text-[10px] text-muted-foreground uppercase font-semibold" numberOfLines={1}>
                                                    {item.driver?.team_name || 'Écurie Inconnue'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 items-center justify-center min-w-[65px]">
                                        <Text className="font-bold text-primary text-sm">
                                            {item.points ?? 0} <Text className="text-[9px] opacity-70 uppercase">pts</Text>
                                        </Text>
                                    </View>
                                </Pressable>
                            )}
                        />
                    )}
                </TabsContent>

                {/* Team Standings Content */}
                <TabsContent value="teams" className="flex-1">
                    {loading && teamStandings.length === 0 ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#E10600" />
                        </View>
                    ) : (
                        <FlatList
                            data={teamStandings}
                            keyExtractor={(item) => item.team_name}
                            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                            renderItem={({ item }) => (
                                <Pressable 
                                    onPress={() => setSelectedTeam(item)}
                                    className="flex-row items-center py-4 border-b border-border/30 bg-card mb-2 px-4 rounded-xl active:bg-white/5"
                                >
                                    <View className="w-8">
                                        <Text className={`font-mono font-bold text-lg ${item.position <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {item.position}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center flex-1">
                                        <View style={{ width: 4, height: 36, backgroundColor: item.team_colour ? `#${item.team_colour}` : '#333', borderRadius: 2, marginRight: 12 }} />
                                        <Image
                                            source={getTeamLogo()}
                                            className="w-8 h-8 mr-3"
                                            resizeMode="contain"
                                        />
                                        <Text className="font-bold text-foreground text-sm flex-1" numberOfLines={1}>
                                            {item.team_name}
                                        </Text>
                                    </View>

                                    <View className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 items-center justify-center min-w-[65px]">
                                        <Text className="font-bold text-primary text-sm">
                                            {item.points ?? 0} <Text className="text-[9px] opacity-70 uppercase">pts</Text>
                                        </Text>
                                    </View>
                                </Pressable>
                            )}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </View>
    );
}
