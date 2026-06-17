import React, { useCallback, useEffect, useState } from 'react';
import {
    View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import {
    ChevronLeft, Trophy, UserPlus, UserCheck,
    MessageCircle, UserX, Clock, Flag, Zap, Star, Users, Calendar,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
    fetchFriendStatus, sendFriendRequest, cancelRequest,
    respondToRequest, unfriend, FriendStatus,
} from '@/lib/api/friends';
import { fetchGlobalLeaderboard } from '@/lib/api/leaderboard';
import { fetchUserBadges, fetchAllBadges, UserBadge, Badge } from '@/lib/api/badges';
import { BadgeCatalog } from '@/components/ui/badge-card';

import { API_URL } from '@/lib/config';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_GRADIENTS: [string, string][] = [
    ['#E10600', '#7B0200'], ['#FF6B35', '#CC4400'],
    ['#0067FF', '#003B99'], ['#00B4D8', '#005F73'],
    ['#9B5DE5', '#6A00BB'], ['#F72585', '#B5007A'],
    ['#06D6A0', '#028A5A'], ['#FFB703', '#C07800'],
];
function avatarGradient(name: string): [string, string] {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}
function avatarColor(name: string) { return avatarGradient(name)[0]; }

function rank(points: number): { label: string; color: string } {
    if (points >= 5000) return { label: 'Légende',  color: '#FFD700' };
    if (points >= 2000) return { label: 'Champion', color: '#E10600' };
    if (points >= 1000) return { label: 'Expert',   color: '#FF6B35' };
    if (points >= 500)  return { label: 'Pilote',   color: '#9B5DE5' };
    return                     { label: 'Rookie',   color: '#888'    };
}

function rankProgress(points: number) {
    const tiers = [0, 500, 1000, 2000, 5000];
    const names = ['Rookie', 'Pilote', 'Expert', 'Champion', 'Légende'];
    const i = tiers.findIndex((t, idx) => points < (tiers[idx + 1] ?? Infinity));
    const from = tiers[i] ?? 0;
    const to   = tiers[i + 1] ?? 5000;
    const pct  = i >= tiers.length - 1 ? 100 : Math.min(((points - from) / (to - from)) * 100, 100);
    return { pct, next: names[i + 1] ?? null, remaining: to - points };
}

function joinDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PublicProfile {
    id: number;
    username: string;
    createdAt?: string;
    profile?: {
        displayName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        points: number;
        favoriteTeamCode: string | null;
        favoriteDriverCode: string | null;
    } | null;
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function UserProfileScreen() {
    const { id }    = useLocalSearchParams();
    const userId    = Number(id);
    const router    = useRouter();
    const { accessToken, user: me } = useAuth();
    const { on } = useSocket();

    const [profile,      setProfile]      = useState<PublicProfile | null>(null);
    const [status,       setStatus]       = useState<FriendStatus>({ status: 'none' });
    const [loading,      setLoading]      = useState(true);
    const [busy,         setBusy]         = useState(false);
    const [globalRank,   setGlobalRank]   = useState<number | null>(null);
    const [friendsCount, setFriendsCount] = useState<number | null>(null);
    const [userBadges,   setUserBadges]   = useState<UserBadge[]>([]);
    const [allBadges,    setAllBadges]    = useState<Badge[]>([]);
    const [refreshing,   setRefreshing]   = useState(false);

    const load = useCallback(async () => {
        if (!accessToken) return;
        const [profileRes, statusRes] = await Promise.all([
            fetch(`${API_URL}/users/${userId}/public`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            }).then(r => r.json()).catch(() => null),
            fetchFriendStatus(userId, accessToken),
        ]);
        if (profileRes?.user) setProfile(profileRes.user);
        setStatus(statusRes);
        setLoading(false);

        // Charger la position globale + le nombre d'amis + badges en arrière-plan
        fetchGlobalLeaderboard(100).then(leaderboard => {
            const entry = leaderboard.find(p => p.userId === userId);
            if (entry) setGlobalRank(entry.rank);
        }).catch(() => null);

        fetch(`${API_URL}/users/${userId}/friends/count`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        }).then(r => r.json()).then(data => {
            if (typeof data?.count === 'number') setFriendsCount(data.count);
        }).catch(() => null);

        fetchUserBadges(userId, accessToken).then(setUserBadges).catch(() => null);
        fetchAllBadges().then(setAllBadges).catch(() => null);
    }, [accessToken, userId]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    useEffect(() => {
        const unsub = on('friend:status_changed', (data) => {
            if (data?.userId === userId || data?.userId === me?.id || !data?.userId) {
                load();
            }
        });
        return () => unsub();
    }, [on, load, userId, me?.id]);

    const send    = async () => { setBusy(true); const r = await sendFriendRequest(userId, accessToken!); if (r.ok) setStatus({ status: 'pending', isSender: true, requestId: r.data?.request?.id }); setBusy(false); };
    const cancel  = async () => { if (!status.requestId) return; setBusy(true); await cancelRequest(status.requestId, accessToken!); setStatus({ status: 'none' }); setBusy(false); };
    const accept  = async () => { if (!status.requestId) return; setBusy(true); await respondToRequest(status.requestId, 'accept', accessToken!); setStatus({ status: 'accepted' }); setBusy(false); };
    const unfriendUser = async () => { setBusy(true); await unfriend(userId, accessToken!); setStatus({ status: 'none' }); setBusy(false); };

    const isMe   = me?.id === userId;
    const name   = profile?.profile?.displayName || profile?.username || `#${userId}`;
    const pts    = profile?.profile?.points ?? 0;
    const r      = rank(pts);
    const grad   = avatarGradient(name);
    const prog   = rankProgress(pts);

    // ── Friend button ─────────────────────────────────────────────────────────
    const FriendBtn = () => {
        if (isMe || !profile) return null;
        if (busy) return <View style={s.btnWrap}><ActivityIndicator color="#E10600" /></View>;

        if (status.status === 'accepted') return (
            <View style={s.btnRow}>
                <TouchableOpacity onPress={() => router.push(`/messages/${userId}` as any)} style={[s.btn, s.btnRed]} activeOpacity={0.8}>
                    <MessageCircle size={18} color="#fff" />
                    <Text style={s.btnText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={unfriendUser} style={[s.btn, s.btnGhost, { flex: 0, paddingHorizontal: 18 }]} activeOpacity={0.7}>
                    <UserX size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
            </View>
        );

        if (status.status === 'pending') return status.isSender
            ? <TouchableOpacity onPress={cancel} style={[s.btn, s.btnGhost]} activeOpacity={0.7}>
                <Clock size={18} color="rgba(255,255,255,0.4)" />
                <Text style={s.btnTextMuted}>Demande envoyée · Annuler</Text>
              </TouchableOpacity>
            : <TouchableOpacity onPress={accept} style={[s.btn, s.btnRed]} activeOpacity={0.8}>
                <UserCheck size={18} color="#fff" />
                <Text style={s.btnText}>Accepter la demande</Text>
              </TouchableOpacity>;

        return (
            <TouchableOpacity onPress={send} style={[s.btn, s.btnRed]} activeOpacity={0.8}>
                <UserPlus size={18} color="#fff" />
                <Text style={s.btnText}>Ajouter en ami</Text>
            </TouchableOpacity>
        );
    };

    if (loading) return (
        <View style={s.loader}><ActivityIndicator color="#E10600" size="large" /></View>
    );

    return (
        <View style={s.root}>
            {/* ── Barre de navigation fixe ── */}
            <SafeAreaView edges={['top']} style={s.navbar}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={22} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
                <Text style={s.navTitle} numberOfLines={1}>{name}</Text>
                <View style={s.navSpacer} />
            </SafeAreaView>

            {/* ── Contenu scrollable ── */}
            <ScrollView
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />}
            >
                {/* Avatar card */}
                <Animated.View entering={FadeInDown.delay(60).springify()} style={s.avatarCard}>
                    <LinearGradient
                        colors={[avatarColor(name) + '25', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />

                    {/* Avatar + nom */}
                    <View style={s.avatarRow}>
                        <View style={s.avatarWrap}>
                            <LinearGradient colors={grad} style={s.avatarCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <Text style={s.avatarInitial}>{name[0]?.toUpperCase()}</Text>
                            </LinearGradient>
                            <View style={[s.avatarRing, { borderColor: r.color }]} />
                        </View>

                        <View style={s.avatarInfo}>
                            <Text style={s.username}>{name}</Text>
                            {profile?.profile?.displayName && (
                                <Text style={s.handle}>@{profile.username}</Text>
                            )}
                            <View style={[s.rankBadge, { backgroundColor: r.color + '20', borderColor: r.color + '40' }]}>
                                <Star size={9} color={r.color} />
                                <Text style={[s.rankBadgeText, { color: r.color }]}>{r.label}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Pills stats */}
                    <View style={s.pillRow}>
                        <View style={s.pill}>
                            <Trophy size={13} color="#FFD700" />
                            <View style={s.pillContent}>
                                <Text style={s.pillVal}>{pts.toLocaleString()}</Text>
                                <Text style={s.pillLabel} numberOfLines={1}>POINTS</Text>
                            </View>
                        </View>
                        {globalRank != null && (
                            <View style={s.pill}>
                                <Text style={s.pillHash}>#</Text>
                                <View style={s.pillContent}>
                                    <Text style={s.pillVal}>{globalRank}</Text>
                                    <Text style={s.pillLabel} numberOfLines={1}>RANG</Text>
                                </View>
                            </View>
                        )}
                        {friendsCount != null && (
                            <View style={s.pill}>
                                <Users size={13} color="#06D6A0" />
                                <View style={s.pillContent}>
                                    <Text style={[s.pillVal, { color: '#06D6A0' }]}>{friendsCount}</Text>
                                    <Text style={s.pillLabel} numberOfLines={1}>AMIS</Text>
                                </View>
                            </View>
                        )}
                        {profile?.createdAt && (
                            <View style={s.pill}>
                                <Calendar size={13} color="#9B5DE5" />
                                <View style={s.pillContent}>
                                    <Text style={s.pillVal} numberOfLines={1}>{joinDate(profile.createdAt)}</Text>
                                    <Text style={s.pillLabel} numberOfLines={1}>DEPUIS</Text>
                                </View>
                            </View>
                        )}
                        {status.status === 'accepted' && (
                            <View style={s.pill}>
                                <Users size={13} color="#00B4D8" />
                                <View style={s.pillContent}>
                                    <Text style={[s.pillVal, { color: '#00B4D8' }]}>Ami</Text>
                                    <Text style={s.pillLabel} numberOfLines={1}>STATUT</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Bouton ami */}
                <Animated.View entering={FadeInDown.delay(120).springify()}>
                    <FriendBtn />
                </Animated.View>

                {/* Bio */}
                <Animated.View entering={FadeInDown.delay(160).springify()} style={s.card}>
                    <Text style={s.cardTitle}>À PROPOS</Text>
                    <Text style={s.bioText}>{profile?.profile?.bio || 'Pas encore de bio.'}</Text>
                </Animated.View>

                {/* Favoris F1 */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={s.card}>
                    <Text style={s.cardTitle}>FAVORIS F1</Text>
                    <View style={s.favRow}>
                        <View style={s.favItem}>
                            <View style={s.favIcon}><Flag size={15} color="#E10600" /></View>
                            <View>
                                <Text style={s.favLabel}>Écurie</Text>
                                <Text style={s.favValue}>{profile?.profile?.favoriteTeamCode || '—'}</Text>
                            </View>
                        </View>
                        <View style={s.favDivider} />
                        <View style={s.favItem}>
                            <View style={s.favIcon}><Zap size={15} color="#E10600" /></View>
                            <View>
                                <Text style={s.favLabel}>Pilote</Text>
                                <Text style={s.favValue}>{profile?.profile?.favoriteDriverCode || '—'}</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Badges */}
                <Animated.View entering={FadeInDown.delay(220).springify()} style={s.card}>
                    <Text style={s.cardTitle}>BADGES</Text>
                    <BadgeCatalog allBadges={allBadges} userBadges={userBadges} />
                </Animated.View>

                {/* Classement */}
                <Animated.View entering={FadeInDown.delay(260).springify()} style={s.rankCard}>
                    {/* Header niveau */}
                    <LinearGradient
                        colors={[r.color + '22', 'transparent']}
                        style={s.rankCardHeader}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                        <Text style={s.rankCardSup}>CLASSEMENT POLEWIN</Text>
                        <View style={s.rankLevelRow}>
                            <View style={[s.rankLevelDot, { backgroundColor: r.color }]} />
                            <Text style={[s.rankLevelName, { color: r.color }]}>{r.label}</Text>
                        </View>
                    </LinearGradient>

                    {/* Stats : points · position · progression */}
                    <View style={s.rankStatsRow}>
                        <View style={s.rankStat}>
                            <View style={s.rankStatIconRow}>
                                <Trophy size={12} color="#FFD700" />
                                <Text style={s.rankStatVal}>{pts.toLocaleString()}</Text>
                            </View>
                            <Text style={s.rankStatLabel}>POINTS</Text>
                        </View>

                        {globalRank != null && (
                            <>
                                <View style={s.rankStatSep} />
                                <View style={s.rankStat}>
                                    <Text style={s.rankStatVal}>
                                        <Text style={s.rankStatHash}>#</Text>{globalRank}
                                    </Text>
                                    <Text style={s.rankStatLabel}>GLOBAL</Text>
                                </View>
                            </>
                        )}

                        <View style={s.rankStatSep} />
                        <View style={s.rankStat}>
                            <Text style={[s.rankStatVal, { color: r.color }]}>{Math.round(prog.pct)}%</Text>
                            <Text style={s.rankStatLabel}>NIVEAU</Text>
                        </View>
                    </View>

                    {/* Barre de progression */}
                    <View style={s.rankProgressWrap}>
                        <View style={s.rankBarTrack}>
                            <LinearGradient
                                colors={[r.color, r.color + '55']}
                                style={[s.rankBarFill, { width: `${prog.pct}%` as any }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            />
                        </View>
                        <View style={s.rankBarMeta}>
                            <Text style={s.rankBarCurrent}>{r.label}</Text>
                            {prog.next
                                ? <Text style={s.rankBarHint}>{prog.remaining.toLocaleString()} pts → {prog.next}</Text>
                                : <Text style={s.rankBarHint}>Niveau maximum !</Text>
                            }
                            {prog.next && <Text style={s.rankBarNext}>{prog.next}</Text>}
                        </View>
                    </View>
                </Animated.View>

            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root:   { flex: 1, backgroundColor: '#0B0B0D' },
    loader: { flex: 1, backgroundColor: '#0B0B0D', alignItems: 'center', justifyContent: 'center' },

    // Navbar
    navbar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 12,
        backgroundColor: '#0B0B0D',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center', justifyContent: 'center',
    },
    navTitle: {
        flex: 1, textAlign: 'center',
        color: '#fff', fontWeight: '900', fontSize: 16,
        fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 1,
        marginHorizontal: 12,
    },
    navSpacer: { width: 38 },

    // Scroll
    scroll: { padding: 16, gap: 12, paddingBottom: 60 },

    // Avatar card
    avatarCard: {
        backgroundColor: '#0c0c0f', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)', borderRadius: 24,
        padding: 20, gap: 20, overflow: 'hidden',
    },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarWrap: { position: 'relative' },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarInitial: { fontSize: 34, fontWeight: '900', color: '#fff', fontStyle: 'italic' },
    avatarRing: {
        position: 'absolute', top: -3, left: -3,
        width: 86, height: 86, borderRadius: 43, borderWidth: 2,
    },
    avatarInfo: { flex: 1, gap: 4 },
    username: {
        color: '#fff', fontWeight: '900', fontSize: 22,
        fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 0.5,
    },
    handle: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' },
    rankBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
        borderWidth: 1, alignSelf: 'flex-start',
    },
    rankBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

    // Pills
    pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    pill: {
        flex: 1, minWidth: 90,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12,
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    pillContent: { flex: 1 },
    pillHash:  { color: 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 11, fontStyle: 'italic' },
    pillVal:   { color: '#fff', fontWeight: '900', fontSize: 13, fontStyle: 'italic', lineHeight: 16 },
    pillLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, lineHeight: 11 },

    // Buttons
    btnWrap: { alignItems: 'center', padding: 16 },
    btnRow:  { flexDirection: 'row', gap: 10 },
    btn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14, borderRadius: 18,
    },
    btnRed:     { backgroundColor: '#E10600' },
    btnGhost:   { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
    btnText:    { color: '#fff', fontWeight: '800', fontSize: 15 },
    btnTextMuted: { color: 'rgba(255,255,255,0.45)', fontWeight: '700', fontSize: 14 },

    // Generic card
    card: {
        backgroundColor: '#0c0c0f', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)', borderRadius: 20,
        padding: 18, gap: 12,
    },
    cardTitle: {
        color: 'rgba(255,255,255,0.28)', fontWeight: '800',
        fontSize: 10, letterSpacing: 2,
    },
    bioText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, fontStyle: 'italic' },

    // Favorites
    favRow:    { flexDirection: 'row', alignItems: 'center' },
    favItem:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    favDivider:{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 8 },
    favIcon:   { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(225,6,0,0.12)', alignItems: 'center', justifyContent: 'center' },
    favLabel:  { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
    favValue:  { color: '#fff', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', fontStyle: 'italic' },

    // Rank card
    rankCard: {
        backgroundColor: '#0c0c0f',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        borderRadius: 20, overflow: 'hidden',
    },
    rankCardHeader: {
        paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14, gap: 6,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    rankCardSup: {
        color: 'rgba(255,255,255,0.28)', fontWeight: '800',
        fontSize: 10, letterSpacing: 2,
    },
    rankLevelRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rankLevelDot:  { width: 8, height: 8, borderRadius: 4 },
    rankLevelName: { fontWeight: '900', fontSize: 26, fontStyle: 'italic', letterSpacing: 0.3 },

    rankStatsRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 18, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    rankStat:        { flex: 1, alignItems: 'center', gap: 4 },
    rankStatIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    rankStatVal:     { color: '#fff', fontWeight: '900', fontSize: 17, fontStyle: 'italic' },
    rankStatHash:    { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
    rankStatLabel:   { color: 'rgba(255,255,255,0.22)', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
    rankStatSep:     { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.06)' },

    rankProgressWrap: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16, gap: 8 },
    rankBarTrack:  { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
    rankBarFill:   { height: '100%', borderRadius: 3 },
    rankBarMeta:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rankBarCurrent:{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    rankBarHint:   { color: 'rgba(255,255,255,0.15)', fontSize: 9, fontWeight: '600', flex: 1, textAlign: 'center' },
    rankBarNext:   { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' },
});
