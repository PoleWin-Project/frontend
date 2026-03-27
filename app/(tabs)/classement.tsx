import { View, FlatList, ActivityIndicator, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { useState, useEffect } from 'react';
import { fetchDriverStandings, fetchTeamStandings, DriverStanding, TeamStanding } from '@/lib/api/meetings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function StandingsScreen() {
    const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
    const [teamStandings, setTeamStandings] = useState<TeamStanding[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('drivers');

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

    return (
        <View className="flex-1 bg-background">
            <ScreenHeader title="Classement F1" subtitle="Championnat du Monde" />
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
                                <View className="flex-row items-center py-4 border-b border-border/30 bg-card mb-2 px-4 rounded-xl">
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
                                </View>
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
                                <View className="flex-row items-center py-4 border-b border-border/30 bg-card mb-2 px-4 rounded-xl">
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
                                </View>
                            )}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </View>
    );
}
