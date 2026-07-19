import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { fetchFriends, FriendRequest, FriendUser } from '@/lib/api/friends';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Users, ChevronRight } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AVATAR_GRADIENTS: [string, string][] = [
    ['#E10600', '#7B0200'], ['#FF6B35', '#CC4400'],
    ['#0067FF', '#003B99'], ['#00B4D8', '#005F73'],
    ['#9B5DE5', '#6A00BB'], ['#F72585', '#B5007A'],
    ['#06D6A0', '#028A5A'], ['#FFB703', '#C07800'],
];

function getAvatarGradient(name: string): [string, string] {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function FriendRow({ friend, index }: { friend: FriendUser; index: number }) {
    const router = useRouter();
    const avatarGradient = getAvatarGradient(friend.username);
    
    return (
        <AnimatedPressable
            entering={FadeInRight.delay(Math.min(index * 40, 500)).springify().damping(14).mass(0.9)}
            style={styles.rowCard}
            onPress={() => router.push(`/user/${friend.id}` as any)}
        >
            <LinearGradient colors={avatarGradient} style={styles.avatarWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.avatarInitial}>{friend.username[0]?.toUpperCase()}</Text>
            </LinearGradient>
            
            <View style={styles.rowInfo}>
                <Text style={styles.rowUsername}>{friend.username}</Text>
                <Text style={styles.rowLabel}>{friend.profile?.points ?? 0} pts</Text>
            </View>
            
            <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
        </AnimatedPressable>
    );
}

export default function FriendsScreen() {
    const { user, accessToken } = useAuth();
    const [friends, setFriends] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (accessToken) {
            loadFriends();
        }
    }, [accessToken]);

    async function loadFriends() {
        if (!accessToken) return;
        const res = await fetchFriends(accessToken);
        setFriends(res);
        setLoading(false);
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFriends();
        setRefreshing(false);
    };

    const ListEmpty = () => (
        !loading ? (
            <Animated.View entering={FadeInDown.springify()} style={styles.emptyWrap}>
                <View style={styles.emptyIconCircle}>
                    <Users size={32} color="#fff" />
                </View>
                <Text style={styles.emptyText}>Aucun ami trouvé</Text>
                <Text style={styles.emptySubText}>Ajoutez des pilotes pour comparer vos scores !</Text>
            </Animated.View>
        ) : null
    );

    return (
        <View style={styles.root}>
            <ScreenHeader title="Mes Amis" subtitle="Ton cercle de pilotes" showPoints showBack />

            <FlatList
                data={friends}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />}
                ListEmptyComponent={ListEmpty}
                renderItem={({ item, index }) => {
                    const friendUser = item.senderId === user?.id ? item.receiver : item.sender;
                    if (!friendUser) return null;
                    return <FriendRow friend={friendUser} index={index} />;
                }}
            />

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#E10600" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050507' },
    listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },

    rowCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#0c0c0f',
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    avatarWrap: {
        width: 44, height: 44,
        borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14
    },
    avatarInitial: { fontSize: 20, fontWeight: '900', color: '#fff', fontStyle: 'italic' },
    
    rowInfo: { flex: 1, justifyContent: 'center' },
    rowUsername: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 2 },
    rowLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },

    emptyWrap: { alignItems: 'center', paddingVertical: 100 },
    emptyIconCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#151515',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16
    },
    emptyText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 16 },
    emptySubText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },

    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center', justifyContent: 'center',
    },
});
