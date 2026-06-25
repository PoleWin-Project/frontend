import React, { useState, useCallback } from 'react';
import {
    View, FlatList, TextInput, TouchableOpacity,
    ActivityIndicator, StyleSheet, Platform, Pressable, RefreshControl
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInRight, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Search, ChevronDown, X, Users, Trophy } from 'lucide-react-native';
import {
    fetchGlobalLeaderboard, fetchMyRank,
    PlayerRank, MyRank,
} from '@/lib/api/leaderboard';
import { useAuth } from '@/context/AuthContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const MEDAL: Record<number, { emoji: string; color: string; rgb: string }> = {
    1: { emoji: '🥇', color: '#FFD700', rgb: '255,215,0' },
    2: { emoji: '🥈', color: '#C0C0C0', rgb: '192,192,192' },
    3: { emoji: '🥉', color: '#CD7F32', rgb: '205,127,50' },
};

// ─── Player Row ───────────────────────────────────────────────────────────────
function PlayerRow({ item, index, isMe }: { item: PlayerRank; index: number; isMe: boolean }) {
    const medal = MEDAL[item.rank] ?? null;
    const isPodium = item.rank <= 3;
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <AnimatedPressable
            entering={FadeInRight.delay(Math.min(index * 40, 500)).springify().damping(14).mass(0.9)}
            onPressIn={() => scale.value = withSpring(0.95)}
            onPressOut={() => scale.value = withSpring(1)}
            style={[
                styles.rowCard,
                animatedStyle,
                isPodium && { borderColor: `rgba(${medal.rgb}, 0.3)`, borderWidth: 1 },
                isMe && !isPodium && { borderColor: '#E10600', borderWidth: 1 },
            ]}
        >
            {/* Background Gradient for Podium or Me */}
            {isPodium && (
                <LinearGradient
                    colors={[`rgba(${medal.rgb}, 0.15)`, 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0 }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
                />
            )}
            {isMe && !isPodium && (
                <LinearGradient
                    colors={['rgba(225,6,0,0.15)', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0 }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
                />
            )}

            <View style={[styles.rankBadge, medal && { backgroundColor: `rgba(${medal.rgb}, 0.15)` }]}>
                {medal ? (
                    <Text style={styles.medalEmoji}>{medal.emoji}</Text>
                ) : (
                    <Text style={[styles.rankText, isMe && { color: '#E10600' }]}>{item.rank}</Text>
                )}
            </View>

            <View style={styles.rowInfo}>
                <Text style={[styles.rowUsername, isMe && { color: '#E10600', fontWeight: '900' }]}>
                    {item.username}
                </Text>
                <Text style={styles.rowLabel}>
                    {item.rank === 1 ? 'Champion' : item.rank === 2 ? 'Vice-champion' : item.rank === 3 ? 'Podium' : 'Compétiteur'}
                </Text>
            </View>

            <View style={[styles.pointsPill, isPodium && { backgroundColor: `rgba(${medal.rgb}, 0.15)` }, isMe && !isPodium && { backgroundColor: 'rgba(225,6,0,0.15)' }]}>
                <Text style={[styles.pointsText, isPodium && { color: medal.color }, isMe && !isPodium && { color: '#E10600' }]}>
                    {item.points.toLocaleString()}
                </Text>
                <Text style={[styles.pointsPts, isPodium && { color: medal.color }, isMe && !isPodium && { color: '#E10600' }]}>PTS</Text>
            </View>
        </AnimatedPressable>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PlayerLeaderboardScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [allPlayers, setAllPlayers] = useState<PlayerRank[]>([]);
    const [myRank, setMyRank] = useState<MyRank | null>(null);
    const [search, setSearch] = useState('');
    const [focused, setFocused] = useState(false);
    const [visibleCount, setVisible] = useState(PAGE_SIZE);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // silent = pull-to-refresh : pas d'overlay de chargement plein écran
    async function loadData(silent = false) {
        if (!silent) setLoading(true);
        try {
            const [players, rank] = await Promise.all([
                fetchGlobalLeaderboard(100),
                fetchMyRank().catch(() => null),
            ]);
            setAllPlayers(players);
            if (rank) setMyRank(rank);
        } catch (e) {
            console.error('Leaderboard Error:', e);
        } finally {
            setLoading(false);
        }
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData(true);
        setRefreshing(false);
    }, []);

    const isSearching = search.trim().length > 0;
    const filtered: PlayerRank[] = isSearching
        ? allPlayers.filter(p =>
            p.username.toLowerCase().includes(search.trim().toLowerCase())
        )
        : allPlayers;

    const shown = filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visibleCount;

    const ListHeader = useCallback(() => (
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
                <Trophy size={20} color="#E10600" />
                <Text style={styles.sectionTitle}>
                    {isSearching
                        ? `${filtered.length} Résultat${filtered.length !== 1 ? 's' : ''}`
                        : 'Tableau d\'Honneur'
                    }
                </Text>
            </View>
            <Text style={styles.sectionSub}>
                {isSearching
                    ? `pour « ${search.trim()} »`
                    : `Top 100 mondial`
                }
            </Text>
        </Animated.View>
    ), [isSearching, filtered.length, search]);

    const ListFooter = useCallback(() =>
        hasMore ? (
            <TouchableOpacity
                onPress={() => setVisible(c => c + PAGE_SIZE)}
                style={styles.loadMoreBtn}
                activeOpacity={0.7}
            >
                <ChevronDown size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.loadMoreText}>Voir plus de pilotes</Text>
            </TouchableOpacity>
        ) : (
            <View style={styles.endRow}>
                <Text style={styles.endText}>— Fin du classement —</Text>
            </View>
        )
        , [hasMore, visibleCount]);

    const ListEmpty = useCallback(() =>
        !loading ? (
            <Animated.View entering={FadeInDown.springify()} style={styles.emptyWrap}>
                <View style={styles.emptyIconCircle}>
                    <Users size={32} color="#fff" />
                </View>
                <Text style={styles.emptyText}>Aucun pilote trouvé</Text>
                <Text style={styles.emptySubText}>Vérifiez l'orthographe</Text>
            </Animated.View>
        ) : null
        , [loading]);

    return (
        <View style={styles.root}>
            <ScreenHeader
                title="Classement"
                subtitle="Le classement mondiale"
                showPoints
            />

            <View style={styles.searchWrap}>
                <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
                    <Search size={18} color={focused ? '#fff' : 'rgba(255,255,255,0.4)'} />
                    <TextInput
                        value={search}
                        onChangeText={text => { setSearch(text); setVisible(PAGE_SIZE); }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Rechercher un pilote..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        style={styles.searchInput}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {isSearching && (
                        <TouchableOpacity
                            onPress={() => { setSearch(''); setVisible(PAGE_SIZE); }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <X size={18} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={shown}
                keyExtractor={(item, index) => (item.userId ?? item.rank ?? index).toString()}
                renderItem={({ item, index }) => (
                    <PlayerRow
                        item={item}
                        index={index}
                        isMe={user?.username?.toLowerCase() === item.username.toLowerCase()}
                    />
                )}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={ListFooter}
                ListEmptyComponent={ListEmpty}
                contentContainerStyle={[styles.listContent, { paddingBottom: myRank ? 160 : 100 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />}
            />

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#E10600" />
                </View>
            )}

            {myRank && !loading && (
                <Animated.View entering={FadeInUp.delay(300).springify().damping(15)} style={styles.myRankBannerWrap}>
                    <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={styles.myRankBanner}>
                        <LinearGradient
                            colors={['rgba(225,6,0,0.15)', 'transparent']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.myRankLeft}>
                            <Text style={styles.myRankLabel}>Votre Position</Text>
                            <Text style={styles.myRankUsername}>{user?.username ?? myRank.username}</Text>
                        </View>
                        <View style={styles.myRankRight}>
                            <View style={styles.myRankPosBadge}>
                                <Text style={styles.myRankPos}>#{myRank.rank}</Text>
                            </View>
                            <Text style={styles.myRankPts}>{myRank.points?.toLocaleString()} pts</Text>
                        </View>
                    </BlurView>
                </Animated.View>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },

    searchWrap: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#151515',
        borderRadius: 18,
        paddingHorizontal: 16, paddingVertical: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)',
    },
    searchBarFocused: { borderColor: 'rgba(225,6,0,0.5)' },
    searchInput: {
        flex: 1, marginLeft: 12, color: '#fff',
        fontSize: 16, fontWeight: '500',
    },

    listContent: { paddingHorizontal: 20, paddingTop: 5 },

    sectionHeader: { marginBottom: 20, marginTop: 5 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: -0.5 },
    sectionSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4, marginLeft: 30 },

    rowCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    rankBadge: {
        width: 44, height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12
    },
    rankText: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 15 },
    medalEmoji: { fontSize: 22 },

    rowInfo: { flex: 1, justifyContent: 'center' },
    rowUsername: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 2 },
    rowLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },

    pointsPill: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 14,
    },
    pointsText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    pointsPts: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', marginLeft: 4, marginTop: 2 },

    loadMoreBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#151515', borderRadius: 16,
        paddingVertical: 16, gap: 8, marginTop: 10,
    },
    loadMoreText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 14 },
    endRow: { alignItems: 'center', paddingVertical: 30 },
    endText: { color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: '600' },

    emptyWrap: { alignItems: 'center', paddingVertical: 80 },
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

    myRankBannerWrap: {
        position: 'absolute', bottom: 30, left: 20, right: 20,
        borderRadius: 24, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(225,6,0,0.3)',
        shadowColor: '#E10600', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
    },
    myRankBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20,
    },
    myRankLeft: { flex: 1 },
    myRankLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    myRankUsername: { color: '#fff', fontWeight: '800', fontSize: 18 },
    myRankRight: { alignItems: 'flex-end' },
    myRankPosBadge: {
        backgroundColor: 'rgba(225,6,0,0.15)',
        paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 10, marginBottom: 4
    },
    myRankPos: { color: '#E10600', fontWeight: '900', fontSize: 20 },
    myRankPts: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' },
});

