import React, { useState, useEffect, useCallback } from 'react';
import {
    View, FlatList, TextInput, TouchableOpacity,
    ActivityIndicator, StyleSheet,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Search, Users, ChevronDown, Star, X, Medal } from 'lucide-react-native';
import {
    fetchGlobalLeaderboard, fetchMyRank,
    PlayerRank, MyRank,
} from '@/lib/api/leaderboard';
import { useAuth } from '@/context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const MEDAL: Record<number, { emoji: string; color: string; glow: string; border: string; rowBorder: string }> = {
    1: { emoji: '🥇', color: '#FFD700', glow: 'rgba(255,215,0,0.10)', border: 'rgba(255,215,0,0.15)', rowBorder: 'rgba(255,215,0,0.30)' },
    2: { emoji: '🥈', color: '#C0C0C0', glow: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.12)', rowBorder: 'rgba(192,192,192,0.25)' },
    3: { emoji: '🥉', color: '#CD7F32', glow: 'rgba(205,127,50,0.08)', border: 'rgba(205,127,50,0.12)', rowBorder: 'rgba(205,127,50,0.25)' },
};

// ─── Player Row ───────────────────────────────────────────────────────────────
function PlayerRow({ item, index }: { item: PlayerRank; index: number }) {
    const medal = MEDAL[item.rank] ?? null;

    return (
        <Animated.View
            entering={FadeInDown.delay(Math.min(index * 45, 500)).springify()}
            style={[
                styles.row,
                medal ? { borderColor: medal.rowBorder, backgroundColor: '#0e0e12' } : null,
            ]}
        >
            {/* Rank / medal badge */}
            <View style={[
                styles.rankBadge,
                medal ? { backgroundColor: medal.glow, borderColor: medal.border } : null,
            ]}>
                {medal
                    ? <Text style={styles.medalEmoji}>{medal.emoji}</Text>
                    : <Text style={styles.rankText}>#{item.rank}</Text>
                }
            </View>

            {/* Info */}
            <View style={styles.rowInfo}>
                <Text style={[styles.rowUsername, medal ? { color: medal.color } : null]}>
                    {item.username}
                </Text>
                <View style={styles.rowSub}>
                    <Medal size={9} color={medal ? medal.color : 'rgba(225,6,0,0.45)'} />
                    <Text style={[styles.rowLabel, medal ? { color: medal.color, opacity: 0.7 } : null]}>
                        {item.rank === 1 ? 'Champion' : item.rank === 2 ? 'Vice-champion' : item.rank === 3 ? 'Podium' : 'Compétiteur'}
                    </Text>
                </View>
            </View>

            {/* Points */}
            <View style={[
                styles.pointsBadge,
                medal ? { backgroundColor: medal.glow, borderColor: medal.border } : null,
            ]}>
                <Text style={[styles.pointsText, medal ? { color: medal.color } : null]}>
                    {item.points.toLocaleString()}
                </Text>
                <Text style={[styles.pointsPts, medal ? { color: medal.color, opacity: 0.6 } : null]}>
                    {' '}pts
                </Text>
            </View>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PlayerLeaderboardScreen() {
    const { user } = useAuth();
    const [loading, setLoading]      = useState(true);
    const [allPlayers, setAllPlayers] = useState<PlayerRank[]>([]);
    const [myRank, setMyRank]        = useState<MyRank | null>(null);
    const [search, setSearch]        = useState('');
    const [focused, setFocused]      = useState(false);
    const [visibleCount, setVisible] = useState(PAGE_SIZE);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
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

    // ── Derived data ──────────────────────────────────────────────────────────
    const isSearching = search.trim().length > 0;

    const filtered: PlayerRank[] = isSearching
        ? allPlayers.filter(p =>
            p.username.toLowerCase().includes(search.trim().toLowerCase())
          )
        : allPlayers;

    const shown   = filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visibleCount;

    // ── List header ───────────────────────────────────────────────────────────
    const ListHeader = useCallback(() => (
        <Animated.View
            entering={FadeInDown.delay(80).springify()}
            style={styles.sectionHeader}
        >
            <LinearGradient
                colors={['rgba(225,6,0,0.2)', 'transparent']}
                style={styles.sectionIconBg}
            >
                {isSearching
                    ? <Search size={15} color="#E10600" />
                    : <Users size={15} color="#E10600" />
                }
            </LinearGradient>
            <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                    {isSearching
                        ? `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`
                        : 'Tableau d\'Honneur'
                    }
                </Text>
                <Text style={styles.sectionSub}>
                    {isSearching
                        ? `pour « ${search.trim()} »`
                        : `${allPlayers.length} pilotes classés · Top 100`
                    }
                </Text>
            </View>
        </Animated.View>
    ), [isSearching, filtered.length, search, allPlayers.length]);

    // ── Footer ────────────────────────────────────────────────────────────────
    const ListFooter = useCallback(() =>
        hasMore ? (
            <TouchableOpacity
                onPress={() => setVisible(c => c + PAGE_SIZE)}
                style={styles.loadMoreBtn}
                activeOpacity={0.7}
            >
                <ChevronDown size={16} color="rgba(255,255,255,0.5)" />
                <Text style={styles.loadMoreText}>
                    Charger {Math.min(PAGE_SIZE, filtered.length - visibleCount)} pilotes de plus
                </Text>
            </TouchableOpacity>
        ) : (
            <View style={styles.endRow}>
                <Text style={styles.endText}>— Fin du classement —</Text>
            </View>
        )
    , [hasMore, filtered.length, visibleCount]);

    // ── Empty ─────────────────────────────────────────────────────────────────
    const ListEmpty = useCallback(() =>
        !loading ? (
            <Animated.View entering={FadeInDown.springify()} style={styles.emptyWrap}>
                <View style={styles.emptyIcon}>
                    <Users size={32} color="rgba(255,255,255,0.1)" />
                </View>
                <Text style={styles.emptyText}>Aucun pilote trouvé</Text>
                <Text style={styles.emptySubText}>Essayez un autre nom</Text>
            </Animated.View>
        ) : null
    , [loading]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <View style={styles.root}>
            <ScreenHeader
                title="Le Salon des Pilotes"
                subtitle="Classement Mondial PoleWin"
                showPoints
            />

            {/* ── Search bar — hors FlatList pour éviter le remount au keystroke ── */}
            <View style={styles.searchWrap}>
                <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
                    <Search size={17} color={focused ? '#E10600' : 'rgba(255,255,255,0.25)'} />
                    <TextInput
                        value={search}
                        onChangeText={text => { setSearch(text); setVisible(PAGE_SIZE); }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Rechercher un pilote…"
                        placeholderTextColor="rgba(255,255,255,0.18)"
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
                            <X size={16} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={shown}
                keyExtractor={(item, index) => (item.userId ?? item.rank ?? index).toString()}
                renderItem={({ item, index }) => <PlayerRow item={item} index={index} />}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={ListFooter}
                ListEmptyComponent={ListEmpty}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: myRank ? 130 : 100 },
                ]}
                showsVerticalScrollIndicator={false}
            />

            {/* ── Loading overlay ── */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#E10600" />
                    <Text style={styles.loadingText}>Chargement du classement…</Text>
                </View>
            )}

            {/* ── Mon classement — sticky ── */}
            {myRank && !loading && (
                <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.myRankBanner}>
                    <LinearGradient
                        colors={['rgba(225,6,0,0.12)', 'rgba(225,6,0,0.03)']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <LinearGradient
                        colors={['rgba(225,6,0,0.22)', 'transparent']}
                        style={styles.sectionIconBg}
                    >
                        <Star size={15} color="#E10600" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.myRankLabel}>Votre classement</Text>
                        <Text style={styles.myRankUsername}>{user?.username ?? myRank.username}</Text>
                    </View>
                    <View style={styles.myRankRight}>
                        <View style={styles.myRankPosBadge}>
                            <Text style={styles.myRankPos}>#{myRank.rank}</Text>
                        </View>
                        <Text style={styles.myRankPts}>{myRank.points?.toLocaleString()} pts</Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0B0B0D' },

    // Search
    searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#0c0c0f',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 18, paddingHorizontal: 16, paddingVertical: 13,
    },
    searchBarFocused: { borderColor: 'rgba(225,6,0,0.5)' },
    searchInput: {
        flex: 1, marginLeft: 12, color: '#fff',
        fontSize: 14, fontWeight: '600',
    },

    // List
    listContent: { paddingHorizontal: 16, paddingTop: 12 },

    // Section header
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center',
        gap: 12, marginBottom: 16,
    },
    sectionIconBg: {
        width: 34, height: 34, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    sectionTitle: {
        color: '#fff', fontWeight: '900', fontSize: 11,
        textTransform: 'uppercase', letterSpacing: 1.5,
    },
    sectionSub: { color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 },

    // Player row
    row: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#0c0c0f',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
        marginBottom: 10,
    },
    rankBadge: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    medalEmoji: { fontSize: 22 },
    rankText: { color: 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 12 },
    rowInfo: { flex: 1 },
    rowUsername: {
        color: '#fff', fontWeight: '800', fontSize: 14,
        textTransform: 'uppercase', fontStyle: 'italic',
    },
    rowSub: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    rowLabel: {
        color: 'rgba(255,255,255,0.35)', fontSize: 9,
        fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2,
    },
    pointsBadge: {
        flexDirection: 'row', alignItems: 'baseline',
        backgroundColor: 'rgba(225,6,0,0.08)',
        borderWidth: 1, borderColor: 'rgba(225,6,0,0.18)',
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9,
    },
    pointsText: { color: '#E10600', fontWeight: '900', fontSize: 14, fontStyle: 'italic' },
    pointsPts: { color: '#E10600', fontWeight: '700', fontSize: 9 },

    // Load more / end
    loadMoreBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        borderRadius: 16, paddingVertical: 16, marginTop: 4, gap: 8,
    },
    loadMoreText: {
        color: 'rgba(255,255,255,0.45)', fontWeight: '700',
        fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
    },
    endRow: { alignItems: 'center', paddingVertical: 24 },
    endText: {
        color: 'rgba(255,255,255,0.15)', fontSize: 11,
        fontWeight: '600', letterSpacing: 1.5,
    },

    // Empty
    emptyWrap: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    emptyText: { color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 15 },
    emptySubText: { color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 4 },

    // Loading
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0B0B0D',
        alignItems: 'center', justifyContent: 'center',
    },
    loadingText: {
        color: 'rgba(255,255,255,0.3)', fontSize: 11,
        fontWeight: '700', textTransform: 'uppercase',
        letterSpacing: 1.5, marginTop: 16,
    },

    // My rank banner
    myRankBanner: {
        position: 'absolute', bottom: 85, left: 16, right: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#0c0c0f',
        borderWidth: 1, borderColor: 'rgba(225,6,0,0.3)',
        borderRadius: 20, padding: 16, overflow: 'hidden',
        shadowColor: '#E10600', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
    },
    myRankLabel: {
        color: 'rgba(255,255,255,0.35)', fontSize: 9,
        fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5,
    },
    myRankUsername: {
        color: '#fff', fontWeight: '900', fontSize: 15,
        textTransform: 'uppercase', fontStyle: 'italic', marginTop: 2,
    },
    myRankRight: { alignItems: 'flex-end', gap: 4 },
    myRankPosBadge: {
        backgroundColor: 'rgba(225,6,0,0.15)',
        borderWidth: 1, borderColor: 'rgba(225,6,0,0.3)',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5,
    },
    myRankPos: { color: '#E10600', fontWeight: '900', fontSize: 15 },
    myRankPts: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700' },
});
