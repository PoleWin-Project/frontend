import React, { useState, useEffect } from 'react';
import {
    View, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet, RefreshControl,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
    LogOut, Trash2, Edit2, Check, X, Shield, Star, Trophy,
    ArrowRight, Users, Target, TrendingUp, Zap, Flag, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLatestSessionTeams, getLatestSessionDrivers, type OpenF1Team, type OpenF1Driver } from '@/lib/api/openf1';
import { fetchUserStats, type UserStats } from '@/lib/api/users';
import { fetchFriends } from '@/lib/api/friends';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { fetchMyBadges, fetchAllBadges, type UserBadge, type Badge } from '@/lib/api/badges';
import { BadgeCatalog, BadgeTileHero } from '@/components/ui/badge-card';
import { GuestPrompt } from '@/components/ui/GuestPrompt';
import { TourGuideZone } from 'rn-tourguide';
import { useScreenTour, usePoleWinTour } from '@/hooks/usePoleWinTour';
import { tourStep } from '@/lib/onboarding';

// ─── Couleur avatar déterministe ──────────────────────────────────────────
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

function getRankLabel(points: number): { label: string; color: string; next: number } {
    if (points >= 5000) return { label: 'Légende', color: '#FFD700', next: 5000 };
    if (points >= 2000) return { label: 'Champion', color: '#E10600', next: 5000 };
    if (points >= 1000) return { label: 'Expert', color: '#FF6B35', next: 2000 };
    if (points >= 500)  return { label: 'Pilote', color: '#9B5DE5', next: 1000 };
    return { label: 'Rookie', color: '#888', next: 500 };
}

// ─── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, valueColor, delay = 0 }: {
    icon: React.ReactNode; label: string; value: string | number;
    sub?: string; color: string; valueColor?: string; delay?: number;
}) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.statCard]}>
            <View style={[styles.statCardIcon, { backgroundColor: color + '18' }]}>{icon}</View>
            <Text style={[styles.statCardValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
            <Text style={styles.statCardLabel}>{label}</Text>
            {sub ? <Text style={styles.statCardSub}>{sub}</Text> : null}
        </Animated.View>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
    const { user, logout, deleteAccount, updateUserProfile, accessToken, isLoading: isAuthLoading } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const tourScrollRef = React.useRef<ScrollView>(null);
    const tourScrollY = React.useRef(0);
    useScreenTour('profile', { scrollRef: tourScrollRef, scrollYRef: tourScrollY });
    const { replayTour } = usePoleWinTour();

    // Réinitialise le tutoriel puis renvoie sur l'accueil pour le redémarrer.
    const handleReplayTour = () => {
        replayTour();
        router.replace('/(tabs)');
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState(user?.profile?.bio || '');
    const [editTeam, setEditTeam] = useState(user?.profile?.favoriteTeamCode || '');
    const [editDriver, setEditDriver] = useState(user?.profile?.favoriteDriverCode || '');
    const [isSaving, setIsSaving] = useState(false);

    const [teams, setTeams] = useState<OpenF1Team[]>([]);
    const [drivers, setDrivers] = useState<OpenF1Driver[]>([]);
    const [loadingLists, setLoadingLists] = useState(false);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [friendCount, setFriendCount] = useState<number>(0);
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [badgesOpen, setBadgesOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (accessToken) {
            loadStats();
            loadFriendCount();
            loadBadges();
        }
    }, [accessToken]);

    useEffect(() => {
        if (isEditing && teams.length === 0) loadLists();
    }, [isEditing]);

    useEffect(() => {
        if (!isEditing) {
            setEditBio(user?.profile?.bio || '');
            setEditTeam(user?.profile?.favoriteTeamCode || '');
            setEditDriver(user?.profile?.favoriteDriverCode || '');
        }
    }, [isEditing, user?.profile]);

    async function loadStats() {
        if (!accessToken) return;
        const res = await fetchUserStats(accessToken);
        if (res.ok) setStats(res.stats);
    }

    async function loadFriendCount() {
        if (!accessToken) return;
        const friends = await fetchFriends(accessToken);
        setFriendCount(friends.length);
    }

    async function loadBadges() {
        if (!accessToken) return;
        const [all, mine] = await Promise.all([fetchAllBadges(), fetchMyBadges(accessToken)]);
        setAllBadges(all);
        setUserBadges(mine);
    }

    async function loadLists() {
        setLoadingLists(true);
        const [tRes, dRes] = await Promise.all([getLatestSessionTeams(), getLatestSessionDrivers()]);
        if (tRes.ok) setTeams(tRes.teams);
        if (dRes.ok) setDrivers(dRes.drivers);
        setLoadingLists(false);
    }

    async function onRefresh() {
        setRefreshing(true);
        await Promise.all([loadStats(), loadFriendCount(), loadBadges()]).catch(() => {});
        setRefreshing(false);
    }

    const handleLogout = () => Alert.alert(
        'Déconnexion', 'Voulez-vous vraiment vous déconnecter ?',
        [{ text: 'Annuler', style: 'cancel' }, { text: 'Déconnexion', style: 'destructive', onPress: logout }]
    );

    const handleDeleteAccount = () => Alert.alert(
        'Supprimer le compte',
        'Cette action est irréversible. Toutes vos données seront effacées.',
        [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: async () => {
                const res = await deleteAccount();
                if (!res.ok) Alert.alert('Erreur', res.error);
            }},
        ]
    );

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateUserProfile({ profile: { bio: editBio, favoriteTeamCode: editTeam, favoriteDriverCode: editDriver } });
        if (res.ok) { setIsEditing(false); }
        else Alert.alert('Erreur', res.error);
        setIsSaving(false);
    };

    if (!user) {
        return <GuestPrompt title="Mon Profil" description="Crée ton profil pilote, suis tes statistiques et débloque des badges exclusifs !" />;
    }

    const points = user.points ?? 0;
    const rank = getRankLabel(points);
    const avatarGradient = getAvatarGradient(user.username);
    const rankProgress = Math.min(
        rank.label === 'Légende' ? 100 :
        ((points - (rank.next === 500 ? 0 : rank.next === 1000 ? 500 : rank.next === 2000 ? 1000 : rank.next === 5000 && rank.label === 'Champion' ? 2000 : 0)) /
        (rank.next - (rank.next === 500 ? 0 : rank.next === 1000 ? 500 : rank.next === 2000 ? 1000 : 2000)) * 100),
        100
    );

    return (
        <View style={styles.root}>
            <ScreenHeader title="Mon Profil" subtitle="Tableau de bord pilote" showPoints />

            <ScrollView
                ref={tourScrollRef}
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
                onScroll={(e) => { tourScrollY.current = e.nativeEvent.contentOffset.y; }}
                scrollEventThrottle={16}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />}
            >
                {/* ── Hero card ── */}
                <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.heroCard}>
                    <LinearGradient
                        colors={[avatarGradient[0] + '20', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />

                    <View style={styles.heroTop}>
                        {/* Avatar */}
                        <View style={styles.avatarWrap}>
                            <LinearGradient colors={avatarGradient} style={styles.avatarGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <Text style={styles.avatarInitial}>{user.username[0]?.toUpperCase()}</Text>
                            </LinearGradient>
                            <View style={[styles.rankRing, { borderColor: rank.color }]} />
                        </View>

                        {/* Info */}
                        <View style={styles.heroInfo}>
                            <Text style={styles.heroUsername}>{user.username}</Text>
                            <Text style={styles.heroEmail}>{user.email}</Text>
                            <View style={[styles.rankBadge, { backgroundColor: rank.color + '20', borderColor: rank.color + '40' }]}>
                                <Star size={10} color={rank.color} />
                                <Text style={[styles.rankBadgeText, { color: rank.color }]}>{rank.label}</Text>
                            </View>
                        </View>

                        {/* Edit button */}
                        {!isEditing && (
                            <Pressable onPress={() => setIsEditing(true)} style={styles.editBtn}>
                                <Edit2 size={15} color="rgba(255,255,255,0.6)" />
                            </Pressable>
                        )}
                    </View>

                    {/* Rank bar */}
                    <View style={{ gap: 6 }}>
                        <View style={styles.rankBarBg}>
                            <LinearGradient
                                colors={[rank.color, rank.color + '60']}
                                style={[styles.rankBarFill, { width: `${rankProgress}%` }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            />
                        </View>
                        <Text style={styles.rankBarHint}>
                            {rank.label === 'Légende' ? '🏆 Niveau maximum !' : `${(rank.next - points).toLocaleString()} pts avant ${
                                rank.next === 500 ? 'Pilote' : rank.next === 1000 ? 'Expert' : rank.next === 2000 ? 'Champion' : 'Légende'
                            }`}
                        </Text>
                    </View>

                </Animated.View>

                {/* ── Formulaire d'édition (carte séparée) ── */}
                {isEditing && (
                    <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.editCard}>
                        {/* Bio */}
                        <View>
                            <Text style={styles.editLabel}>Mini Bio</Text>
                            <View style={styles.editTextAreaWrap}>
                                <Input
                                    multiline
                                    numberOfLines={4}
                                    value={editBio}
                                    onChangeText={setEditBio}
                                    style={{ color: '#fff', fontSize: 14, height: 100, paddingHorizontal: 14, paddingVertical: 10, textAlignVertical: 'top' }}
                                    placeholder="Ta passion F1 en quelques mots..."
                                    placeholderTextColor="rgba(255,255,255,0.25)"
                                />
                            </View>
                        </View>

                        {/* Pickers */}
                        <View style={styles.editRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.editLabel}>Écurie</Text>
                                <ScrollView style={styles.editPicker} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                    {loadingLists
                                        ? <ActivityIndicator size="small" color="#E10600" style={{ marginTop: 12 }} />
                                        : teams.map(t => (
                                            <Pressable key={t.team_name} onPress={() => setEditTeam(t.team_name)}
                                                style={[styles.editPickerItem, editTeam === t.team_name && styles.editPickerItemActive]}>
                                                <Text style={[styles.editPickerText, editTeam === t.team_name && styles.editPickerTextActive]}>
                                                    {t.team_name}
                                                </Text>
                                            </Pressable>
                                        ))
                                    }
                                </ScrollView>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.editLabel}>Pilote</Text>
                                <ScrollView style={styles.editPicker} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                    {loadingLists
                                        ? <ActivityIndicator size="small" color="#E10600" style={{ marginTop: 12 }} />
                                        : drivers.map(d => (
                                            <Pressable key={d.driver_number} onPress={() => setEditDriver(d.name_acronym)}
                                                style={[styles.editPickerItem, editDriver === d.name_acronym && styles.editPickerItemActive]}>
                                                <Text style={[styles.editPickerText, editDriver === d.name_acronym && styles.editPickerTextActive]}>
                                                    {d.full_name}
                                                </Text>
                                            </Pressable>
                                        ))
                                    }
                                </ScrollView>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.editActions}>
                            <Button style={[styles.editActionBtn, styles.editActionBtnCancel]} onPress={() => setIsEditing(false)}>
                                <Icon as={X} size={16} className="text-white/50 mr-1" />
                                <Text className="text-white/50 font-bold">Annuler</Text>
                            </Button>
                            <Button style={[styles.editActionBtn, styles.editActionBtnSave]} onPress={handleSave} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator size="small" color="white" /> : (
                                    <>
                                        <Icon as={Check} size={16} className="text-white mr-1" />
                                        <Text className="text-white font-bold">Enregistrer</Text>
                                    </>
                                )}
                            </Button>
                        </View>
                    </Animated.View>
                )}

                {/* ── Favoris ── */}
                {!isEditing && (
                    <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.favCard}>
                        <Text style={styles.sectionLabel}>Favoris F1</Text>
                        <View style={styles.favRow}>
                            <View style={styles.favItem}>
                                <LinearGradient colors={['rgba(225,6,0,0.18)', 'transparent']} style={styles.favIcon}>
                                    <Flag size={15} color="#E10600" />
                                </LinearGradient>
                                <View>
                                    <Text style={styles.favLabel}>Écurie</Text>
                                    <Text style={styles.favValue}>{user.profile?.favoriteTeamCode || '—'}</Text>
                                </View>
                            </View>
                            <View style={styles.favDivider} />
                            <View style={styles.favItem}>
                                <LinearGradient colors={['rgba(225,6,0,0.18)', 'transparent']} style={styles.favIcon}>
                                    <Zap size={15} color="#E10600" />
                                </LinearGradient>
                                <View>
                                    <Text style={styles.favLabel}>Pilote</Text>
                                    <Text style={styles.favValue}>{user.profile?.favoriteDriverCode || '—'}</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* ── Bio ── */}
                {!isEditing && (
                    <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.bioCard}>
                        <Text style={styles.sectionLabel}>Ma Bio</Text>
                        <Text style={styles.bioText}>
                            {user.profile?.bio || 'Pas encore de bio. Appuie sur ✏️ pour en ajouter une.'}
                        </Text>
                    </Animated.View>
                )}

                {/* ── Badges ── */}
                {!isEditing && (() => {
                    const pionnier = allBadges.find(b => b.code === 'pionnier_du_paddock') ?? null;
                    return (
                        <TourGuideZone
                            zone={1}
                            tourKey="profile"
                            shape="rectangle"
                            text={tourStep(1, 3, 'Tes badges 🎖️', 'Débloque des badges et accumule des coins en jouant.')}
                        >
                        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.badgeCard}>
                            <Pressable style={styles.badgeHeader} onPress={() => setBadgesOpen(v => !v)}>
                                <View>
                                    <Text style={styles.sectionLabel}>Badges</Text>
                                    <Text style={styles.badgeSubtitle}>
                                        {userBadges.length} / {allBadges.length} débloqués
                                    </Text>
                                </View>
                                {badgesOpen
                                    ? <ChevronUp size={18} color="rgba(255,255,255,0.3)" />
                                    : <ChevronDown size={18} color="rgba(255,255,255,0.3)" />
                                }
                            </Pressable>

                            {badgesOpen ? (
                                <BadgeCatalog allBadges={allBadges} userBadges={userBadges} />
                            ) : (
                                <View style={styles.badgePreview}>
                                    {pionnier && <BadgeTileHero badge={pionnier} userBadge={null} />}
                                    <Text style={styles.badgeMore}>
                                        {allBadges.length > 1
                                            ? `+${allBadges.length - 1} badges à découvrir →`
                                            : 'Appuie pour voir tous les badges →'}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                        </TourGuideZone>
                    );
                })()}

                {/* ── Stats grid ── */}
                <Text style={styles.sectionTitle}>Statistiques</Text>
                <TourGuideZone
                    zone={2}
                    tourKey="profile"
                    shape="rectangle"
                    text={tourStep(2, 3, 'Tes statistiques 📈', 'Points, victoires, win rate… suis ta progression de pilote ici.')}
                >
                <View style={styles.statsGrid}>
                    <StatCard
                        icon={<Trophy size={18} color="#FFD700" />}
                        label="Points" value={points.toLocaleString()}
                        color="#FFD700" delay={200}
                    />
                    <StatCard
                        icon={<Users size={18} color="#00B4D8" />}
                        label="Amis" value={friendCount}
                        color="#00B4D8" delay={220}
                    />
                    <StatCard
                        icon={<Target size={18} color="#06D6A0" />}
                        label="Victoires" value={stats?.won ?? 0}
                        sub={stats ? `sur ${stats.total}` : undefined}
                        color="#06D6A0" delay={240}
                    />
                    <StatCard
                        icon={<TrendingUp size={18} color="#9B5DE5" />}
                        label="Win Rate" value={stats ? `${stats.winRate}%` : '—'}
                        color="#9B5DE5" delay={260}
                    />
                    <StatCard
                        icon={<Zap size={18} color="#FFB703" />}
                        label="Pronostics" value={stats?.total ?? 0}
                        color="#FFB703" delay={280}
                    />
                    <StatCard
                        icon={<Star size={18} color={stats && stats.netGain < 0 ? '#ef4444' : '#22c55e'} />}
                        label="Bilan paris"
                        sub="gains − mises"
                        value={stats ? `${stats.netGain >= 0 ? '+' : ''}${stats.netGain} pts` : '—'}
                        valueColor={stats ? (stats.netGain < 0 ? '#ef4444' : stats.netGain > 0 ? '#22c55e' : '#fff') : '#fff'}
                        color={stats && stats.netGain < 0 ? '#ef4444' : '#22c55e'}
                        delay={300}
                    />
                </View>
                </TourGuideZone>

                {/* ── Paramètres ── */}
                <Text style={styles.sectionTitle}>Paramètres système</Text>
                <TourGuideZone
                    zone={3}
                    tourKey="profile"
                    shape="rectangle"
                    text={tourStep(3, 3, 'Réglages ⚙️', 'Gère ton compte ici — et rejoue ce tutoriel quand tu veux.')}
                >
                <Animated.View entering={FadeInDown.delay(360).springify()} style={styles.settingsCard}>
                    <Pressable onPress={handleLogout} style={styles.settingsRow}>
                        <View style={[styles.settingsIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                            <LogOut size={17} color="rgba(255,255,255,0.7)" />
                        </View>
                        <Text style={styles.settingsText}>Se déconnecter</Text>
                        <ArrowRight size={15} color="rgba(255,255,255,0.15)" />
                    </Pressable>
                    <View style={styles.settingsDivider} />
                    <Pressable onPress={handleDeleteAccount} style={styles.settingsRow}>
                        <View style={[styles.settingsIcon, { backgroundColor: 'rgba(225,6,0,0.1)' }]}>
                            <Trash2 size={17} color="#E10600" />
                        </View>
                        <Text style={[styles.settingsText, { color: '#E10600' }]}>Supprimer mon compte</Text>
                        <Shield size={15} color="rgba(225,6,0,0.25)" />
                    </Pressable>
                </Animated.View>

                {/* Revoir le tutoriel d'onboarding */}
                <Pressable onPress={handleReplayTour} style={styles.replayTutoBtn}>
                    <Text style={styles.replayTutoText}>Revoir le tutoriel</Text>
                </Pressable>
                </TourGuideZone>

                <Text style={styles.versionText}>PoleWin v1.2.0 • Build b742</Text>
            </ScrollView>

            {isAuthLoading && (
                <View style={StyleSheet.absoluteFillObject as any}>
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#E10600" />
                    </View>
                </View>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050507' },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, gap: 12 },

    // Hero card
    heroCard: {
        backgroundColor: '#0c0c0f', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)', borderRadius: 24,
        padding: 20, gap: 16, overflow: 'hidden',
    },
    // Edit card (carte séparée pour le formulaire)
    editCard: {
        backgroundColor: '#0c0c0f', borderWidth: 1,
        borderColor: 'rgba(225,6,0,0.2)', borderRadius: 24,
        padding: 20, gap: 16,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatarWrap: { position: 'relative' },
    avatarGradient: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 32, fontWeight: '900', color: '#fff', fontStyle: 'italic' },
    rankRing: {
        position: 'absolute', borderWidth: 2, borderRadius: 42,
        width: 80, height: 80, top: -4, left: -4,
    },
    heroInfo: { flex: 1, gap: 2 },
    heroUsername: { fontSize: 22, fontWeight: '900', color: '#fff', fontStyle: 'italic', textTransform: 'uppercase' },
    heroEmail: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
    rankBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
        borderWidth: 1, alignSelf: 'flex-start', marginTop: 4,
    },
    rankBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    editBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },

    // Rank bar
    rankBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
    rankBarFill: { height: '100%', borderRadius: 2 },
    rankBarHint: { fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: '600', textAlign: 'right' },

    // Edit form
    editForm: { gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16 },
    editLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
    editTextAreaWrap: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16 },
    editRow: { flexDirection: 'row', gap: 12 },
    editPicker: { height: 140, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 6 },
    editPickerItem: { padding: 8, borderRadius: 10, marginBottom: 2 },
    editPickerItemActive: { backgroundColor: '#E10600' },
    editPickerText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
    editPickerTextActive: { color: '#fff' },
    editActions: { flexDirection: 'row', gap: 10 },
    editActionBtn: { flex: 1, height: 46, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    editActionBtnCancel: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    editActionBtnSave: { backgroundColor: '#E10600' },

    // Fav card
    favCard: {
        backgroundColor: '#0c0c0f', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 18, gap: 12,
    },
    favRow: { flexDirection: 'row', alignItems: 'center' },
    favItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    favDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 8 },
    favIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    favLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
    favValue: { fontSize: 13, color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' },

    // Badges
    badgeCard: {
        backgroundColor: '#0c0c0f', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 18, gap: 12,
    },
    badgeHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    badgeSubtitle: {
        color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '600', marginTop: 2,
    },
    badgePreview: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
    },
    badgeMore: {
        flex: 1, color: 'rgba(255,255,255,0.3)', fontSize: 12,
        fontWeight: '700', fontStyle: 'italic',
    },

    // Bio
    bioCard: {
        backgroundColor: '#0c0c0f', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 18, gap: 10,
    },
    bioText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20, fontStyle: 'italic' },

    // Section titles
    sectionLabel: { color: 'rgba(255,255,255,0.28)', fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
    sectionTitle: { color: 'rgba(255,255,255,0.28)', fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },

    // Stats grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: {
        width: '30.5%', backgroundColor: '#0c0c0f',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 18, padding: 14, gap: 4, alignItems: 'flex-start',
    },
    statCardIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    statCardValue: { color: '#fff', fontWeight: '900', fontSize: 20, fontStyle: 'italic' },
    statCardLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    statCardSub: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '600' },

    // Settings
    settingsCard: {
        backgroundColor: '#0c0c0f', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden',
    },
    settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, activeOpacity: 0.7 } as any,
    settingsIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    settingsText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 15 },
    settingsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16 },

    // Revoir le tutoriel
    replayTutoBtn: {
        backgroundColor: '#E10600',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    replayTutoText: { color: '#fff', fontFamily: 'Inter_Bold', fontWeight: '700', fontSize: 15 },

    // Misc
    versionText: { textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: 10, fontWeight: '600', letterSpacing: 1.5, marginTop: 12 },
    loadingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
});
