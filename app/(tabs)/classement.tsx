import React, { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Users, Medal } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { fetchGlobalLeaderboard, PlayerRank } from '@/lib/api/leaderboard';

export default function PlayerLeaderboardScreen() {
    const [loading, setLoading] = useState(true);
    const [playerRanks, setPlayerRanks] = useState<PlayerRank[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const data = await fetchGlobalLeaderboard();
            setPlayerRanks(data);
        } catch (error) {
            console.error('Leaderboard Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View className="flex-1 bg-background">
            <ScreenHeader title="Le Salon des Pilotes" subtitle="Classement Mondial PoleWin" showPoints={true} />
            
            <View className="flex-1">
                {loading && playerRanks.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#ef1f14" />
                    </View>
                ) : (
                    <FlatList
                        data={playerRanks}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        renderItem={({ item }) => (
                            <View className="flex-row items-center py-4 bg-[#0c0c0f] mb-3 px-4 rounded-2xl border border-white/5">
                                <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4 border border-white/10">
                                    <Text className={`font-black text-sm ${item.rank <= 3 ? 'text-primary' : 'text-white/40'}`}>
                                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-base uppercase italic">{item.username}</Text>
                                    <View className="flex-row items-center">
                                        <Icon as={Medal} size={10} className="text-primary/60 mr-1" />
                                        <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Compétiteur</Text>
                                    </View>
                                </View>
                                <View className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                                    <Text className="text-primary font-black text-lg italic">{item.points.toLocaleString()}</Text>
                                </View>
                            </View>
                        )}
                        ListHeaderComponent={
                            <View className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-6 flex-row items-center">
                                <View className="bg-primary/20 p-2 rounded-lg mr-4">
                                    <Icon as={Users} size={20} className="text-primary" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-black uppercase text-xs">Tableau d'Honneur</Text>
                                    <Text className="text-white/40 text-[10px]">Tous les pilotes qualifiés</Text>
                                </View>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}
