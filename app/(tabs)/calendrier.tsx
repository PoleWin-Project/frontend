import { Text } from '@/components/ui/text';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { MeetingItem, fetchMeetings } from '@/lib/api/meetings';
import { MeetingCard } from '@/components/calendar/MeetingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ExploreScreen() {
    const [meetings, setMeetings] = useState<MeetingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('upcoming');

    // Filter logic
    const now = Date.now();

    // Process backend array based on date_end
    const upcomingMeetings = meetings.filter(m => new Date(m.date_end).getTime() >= now)
        .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()); // nearest first

    const pastMeetings = meetings.filter(m => new Date(m.date_end).getTime() < now)
        .sort((a, b) => new Date(b.date_end).getTime() - new Date(a.date_end).getTime()); // most recent past first

    useEffect(() => {
        async function loadData() {
            try {
                const data = await fetchMeetings(2026);
                setMeetings(data);
            } catch (err: any) {
                setError(err.message || 'Error loading meetings');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" className="text-primary" />
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 items-center justify-center bg-background p-4">
                <Text className="text-center text-destructive mb-4">{error}</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                {/* Custom Tabs */}
                <View className="mx-4 mt-4 mb-2">
                    <TabsList className="flex-row">
                        <TabsTrigger value="upcoming" className="flex-1">
                            <Text>À venir ({upcomingMeetings.length})</Text>
                        </TabsTrigger>
                        <TabsTrigger value="past" className="flex-1">
                            <Text>Terminées ({pastMeetings.length})</Text>
                        </TabsTrigger>
                    </TabsList>
                </View>

                {/* Lists */}
                <TabsContent value="upcoming" className="flex-1">
                    <FlatList
                        data={upcomingMeetings}
                        keyExtractor={(item) => item.meeting_key.toString()}
                        renderItem={({ item }) => <MeetingCard meeting={item} />}
                        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View className="py-10 items-center">
                                <Text className="text-muted-foreground">Aucune course à venir.</Text>
                            </View>
                        }
                    />
                </TabsContent>

                <TabsContent value="past" className="flex-1">
                    <FlatList
                        data={pastMeetings}
                        keyExtractor={(item) => item.meeting_key.toString()}
                        renderItem={({ item }) => <MeetingCard meeting={item} />}
                        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View className="py-10 items-center">
                                <Text className="text-muted-foreground">Aucune course terminée.</Text>
                            </View>
                        }
                    />
                </TabsContent>
            </Tabs>
        </View>
    );
}