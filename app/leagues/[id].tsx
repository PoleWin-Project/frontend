import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Copy,
  Crown,
  Flag,
  LogOut,
  Pencil,
  RefreshCw,
  Share2,
  Shield,
  Trash2,
  Trophy,
  TimerReset,
  Users,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { LeagueMemberRow } from '@/components/leagues/LeagueMemberRow';
import { leagueAccent } from '@/components/leagues/LeagueCard';
import { useAuth } from '@/context/AuthContext';
import {
  deleteLeague,
  fetchLeague,
  LeagueApiError,
  leaveLeague,
  regenerateInviteCode,
  removeLeagueMember,
  renameLeague,
  type LeagueDetail,
  type LeagueMember,
} from '@/lib/api/leagues';

function messageFor(error: unknown) {
  return error instanceof LeagueApiError ? error.message : 'Action impossible pour le moment.';
}

export default function LeagueDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const leagueId = Number(params.id);
  const { user, accessToken } = useAuth();
  const [league, setLeague] = useState<LeagueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const accent = useMemo(() => leagueAccent(leagueId || 1), [leagueId]);

  const load = useCallback(async (silent = false) => {
    if (!accessToken || !Number.isInteger(leagueId) || leagueId <= 0) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const data = await fetchLeague(leagueId, accessToken);
      setLeague(data);
      setName(data.name);
      setError(null);
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setLoading(false);
    }
  }, [accessToken, leagueId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const shareInvite = useCallback(async () => {
    if (!league) return;
    await Share.share({
      title: `Rejoins ${league.name} sur PoleWin`,
      message: `🏁 Rejoins mon Écurie « ${league.name} » sur PoleWin !\n\nCode : ${league.inviteCode}\nLien : polewin://leagues/join?code=${encodeURIComponent(league.inviteCode)}`,
    });
  }, [league]);

  const saveName = useCallback(async () => {
    if (!league || !accessToken || !name.trim() || busy) return;
    setBusy(true);
    try {
      setLeague(await renameLeague(league.id, name.trim(), accessToken));
      setEditing(false);
    } catch (e) { Alert.alert('Nom non modifié', messageFor(e)); }
    finally { setBusy(false); }
  }, [accessToken, busy, league, name]);

  const regenerate = useCallback(() => {
    if (!league || !accessToken) return;
    Alert.alert('Changer le code ?', 'L’ancien code cessera immédiatement de fonctionner.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Générer', onPress: async () => {
        setBusy(true);
        try {
          const inviteCode = await regenerateInviteCode(league.id, accessToken);
          setLeague(current => current ? { ...current, inviteCode } : current);
        } catch (e) { Alert.alert('Code non modifié', messageFor(e)); }
        finally { setBusy(false); }
      } },
    ]);
  }, [accessToken, league]);

  const removeMember = useCallback((member: LeagueMember) => {
    if (!league || !accessToken) return;
    Alert.alert('Retirer ce pilote ?', `${member.username} n’aura plus accès au classement de l’Écurie.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: async () => {
        try {
          await removeLeagueMember(league.id, member.userId, accessToken);
          await load(true);
        } catch (e) { Alert.alert('Pilote non retiré', messageFor(e)); }
      } },
    ]);
  }, [accessToken, league, load]);

  const leaveOrDelete = useCallback(() => {
    if (!league || !accessToken) return;
    const owner = league.canManage;
    Alert.alert(
      owner ? 'Supprimer l’Écurie ?' : 'Quitter l’Écurie ?',
      owner ? 'Le classement, les membres et le code seront supprimés définitivement.' : 'Tu ne verras plus ce classement privé.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: owner ? 'Supprimer' : 'Quitter', style: 'destructive', onPress: async () => {
          try {
            if (owner) await deleteLeague(league.id, accessToken);
            else await leaveLeague(league.id, accessToken);
            router.replace('/leagues' as never);
          } catch (e) { Alert.alert('Action impossible', messageFor(e)); }
        } },
      ],
    );
  }, [accessToken, league, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(true); setRefreshing(false);
  }, [load]);

  if (loading && !league) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#E10600" /><Text style={styles.loadingText}>Préparation de la grille...</Text></View>;
  }

  if (!league) {
    return (
      <View style={styles.center}>
        <Shield size={42} color="#E10600" />
        <Text style={styles.errorTitle}>Accès refusé</Text>
        <Text style={styles.errorText}>{error ?? 'Écurie introuvable.'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backFallback}><Text style={styles.backFallbackText}>Retour</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />}
      >
        <Animated.View entering={FadeIn.duration(350)} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <LinearGradient colors={[`${accent}66`, '#170304', '#050507']} style={StyleSheet.absoluteFillObject} />
          <View style={styles.heroTop}>
            <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.roundButton}><ChevronLeft size={23} color="#fff" /></Pressable>
            <View style={styles.heroBadge}><Flag size={12} color="#fff" /><Text style={styles.heroBadgeText}>ÉCURIE PRIVÉE</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Partager l’invitation" onPress={() => { void shareInvite(); }} style={styles.roundButton}><Share2 size={20} color="#fff" /></Pressable>
          </View>
          <View style={styles.carNumber}><Text style={styles.carNumberText}>{String(league.id).padStart(2, '0').slice(-2)}</Text></View>
          <Text numberOfLines={2} style={styles.heroTitle}>{league.name}</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}><Users size={15} color="#fff" /><Text style={styles.heroStatValue}>{league.memberCount}</Text><Text style={styles.heroStatLabel}>PILOTES</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.heroStat}><Trophy size={15} color="#FFD166" /><Text style={styles.heroStatValue}>{league.myRank ? `P${league.myRank}` : '—'}</Text><Text style={styles.heroStatLabel}>TA POSITION</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.heroStat}><Crown size={15} color="#FFD166" /><Text numberOfLines={1} style={styles.ownerValue}>{league.ownerUsername}</Text><Text style={styles.heroStatLabel}>DIRECTEUR</Text></View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify().damping(17)} style={styles.inviteCard}>
          <View style={styles.inviteCopy}>
            <Text style={styles.inviteEyebrow}>CODE D’ACCÈS</Text>
            <Text selectable style={styles.inviteCode}>{league.inviteCode}</Text>
            <Text style={styles.inviteHint}>Partage-le uniquement avec les pilotes que tu veux inviter.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Partager le code" onPress={() => { void shareInvite(); }} style={styles.shareButton}>
            <Copy size={19} color="#fff" /><Text style={styles.shareText}>Partager</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.scoringCard}>
          <View style={styles.scoringIcon}>
            {league.scoringMode === 'from_join' ? <TimerReset size={20} color="#fff" /> : <Trophy size={20} color="#fff" />}
          </View>
          <View style={styles.scoringCopy}>
            <Text style={styles.scoringEyebrow}>MODE DE CLASSEMENT</Text>
            <Text style={styles.scoringTitle}>{league.scoringMode === 'from_join' ? 'Nouveau championnat' : 'Saison actuelle'}</Text>
            <Text style={styles.scoringText}>{league.scoringMode === 'from_join' ? 'Chaque pilote marque ses points à partir de son arrivée.' : 'Les points de toute la saison sont pris en compte.'}</Text>
          </View>
        </View>

        {league.canManage ? (
          <Animated.View layout={Layout.springify()} style={styles.management}>
            <View style={styles.managementHeader}>
              <View><Text style={styles.managementEyebrow}>DIRECTION DE COURSE</Text><Text style={styles.managementTitle}>Gérer l’Écurie</Text></View>
              <Crown size={22} color="#FFD166" />
            </View>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput value={name} onChangeText={setName} maxLength={32} autoFocus style={styles.editInput} placeholderTextColor="#666" />
                <Pressable disabled={busy} onPress={() => { void saveName(); }} style={styles.saveButton}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>OK</Text>}</Pressable>
                <Pressable onPress={() => { setEditing(false); setName(league.name); }} style={styles.cancelEdit}><X size={18} color="#aaa" /></Pressable>
              </View>
            ) : (
              <View style={styles.managementActions}>
                <Pressable onPress={() => setEditing(true)} style={styles.managementButton}><Pencil size={16} color="#fff" /><Text style={styles.managementButtonText}>Renommer</Text></Pressable>
                <Pressable disabled={busy} onPress={regenerate} style={styles.managementButton}><RefreshCw size={16} color="#fff" /><Text style={styles.managementButtonText}>Nouveau code</Text></Pressable>
              </View>
            )}
          </Animated.View>
        ) : null}

        <View style={styles.rankingHeader}>
          <View><Text style={styles.rankingEyebrow}>CHAMPIONNAT {league.seasonYear}</Text><Text style={styles.rankingTitle}>Classement de l’Écurie</Text></View>
          <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
        </View>
        {league.members.map((member, index) => (
          <LeagueMemberRow
            key={member.userId}
            member={member}
            index={index}
            isMe={member.userId === user?.id}
            canManage={league.canManage}
            onOpen={() => router.push(`/user/${member.userId}` as never)}
            onRemove={() => removeMember(member)}
          />
        ))}

        <View style={styles.rules}>
          <Text style={styles.rulesTitle}>RÈGLEMENT SPORTIF</Text>
          <Text style={styles.rulesText}>{league.scoringMode === 'from_join' ? 'Chaque pilote débute à 0 lors de son arrivée. Ses prochains points PoleWin alimentent automatiquement ce classement privé.' : 'Tous les points gagnés pendant la saison PoleWin sont repris dans ce classement privé.'}</Text>
        </View>

        <Pressable onPress={leaveOrDelete} style={styles.dangerButton}>
          {league.canManage ? <Trash2 size={17} color="#ff6961" /> : <LogOut size={17} color="#ff6961" />}
          <Text style={styles.dangerText}>{league.canManage ? 'Supprimer cette Écurie' : 'Quitter cette Écurie'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050507' },
  content: { paddingBottom: 70 },
  center: { flex: 1, backgroundColor: '#050507', alignItems: 'center', justifyContent: 'center', padding: 30 },
  loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 13, fontWeight: '700' },
  errorTitle: { color: '#fff', fontFamily: 'Montserrat_Bold', fontSize: 22, marginTop: 16 },
  errorText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8 },
  backFallback: { backgroundColor: '#E10600', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, marginTop: 22 },
  backFallbackText: { color: '#fff', fontWeight: '900' },
  hero: { minHeight: 360, paddingHorizontal: 20, paddingTop: 58, paddingBottom: 24, overflow: 'hidden', borderBottomLeftRadius: 34, borderBottomRightRadius: 34 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#E10600', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 9 },
  heroBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  carNumber: { position: 'absolute', right: 14, top: 96, opacity: 0.12 },
  carNumberText: { color: '#fff', fontFamily: 'Montserrat_Bold_Italic', fontSize: 126, letterSpacing: -12 },
  heroTitle: { color: '#fff', fontFamily: 'Montserrat_Bold_Italic', fontSize: 35, lineHeight: 39, letterSpacing: -1.5, marginTop: 44, maxWidth: '86%' },
  heroStats: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 18, paddingVertical: 14, marginTop: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroStat: { flex: 1, alignItems: 'center', minWidth: 0 },
  heroStatValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 4 },
  ownerValue: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 6, maxWidth: 95 },
  heroStatLabel: { color: 'rgba(255,255,255,0.38)', fontSize: 7, fontWeight: '900', letterSpacing: 1, marginTop: 3 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  inviteCard: { marginHorizontal: 20, marginTop: -1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d0d10', borderRadius: 22, padding: 17, borderWidth: 1, borderColor: 'rgba(225,6,0,0.24)' },
  inviteCopy: { flex: 1 },
  inviteEyebrow: { color: '#E10600', fontSize: 8, fontWeight: '900', letterSpacing: 1.6 },
  inviteCode: { color: '#fff', fontFamily: 'Montserrat_Bold', fontSize: 22, letterSpacing: 3, marginTop: 3 },
  inviteHint: { color: 'rgba(255,255,255,0.38)', fontSize: 10, marginTop: 4, maxWidth: 230 },
  scoringCard: { marginHorizontal: 20, marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d0d10', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  scoringIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E10600', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  scoringCopy: { flex: 1 },
  scoringEyebrow: { color: '#E10600', fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  scoringTitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 2 },
  scoringText: { color: 'rgba(255,255,255,0.42)', fontSize: 10, lineHeight: 14, marginTop: 3 },
  shareButton: { height: 46, borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#E10600', flexDirection: 'row', alignItems: 'center', gap: 7 },
  shareText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  management: { margin: 20, marginBottom: 0, backgroundColor: '#0d0d10', borderRadius: 22, padding: 17, borderWidth: 1, borderColor: 'rgba(255,209,102,0.2)' },
  managementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  managementEyebrow: { color: '#FFD166', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  managementTitle: { color: '#fff', fontFamily: 'Montserrat_Bold', fontSize: 17, marginTop: 3 },
  managementActions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  managementButton: { flex: 1, height: 43, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  managementButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  editInput: { flex: 1, height: 45, borderRadius: 12, backgroundColor: '#050507', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', color: '#fff', paddingHorizontal: 12, fontWeight: '700' },
  saveButton: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#E10600', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontWeight: '900' },
  cancelEdit: { width: 40, height: 45, alignItems: 'center', justifyContent: 'center' },
  rankingHeader: { marginHorizontal: 20, marginTop: 30, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  rankingEyebrow: { color: '#E10600', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  rankingTitle: { color: '#fff', fontFamily: 'Montserrat_Bold', fontSize: 21, marginTop: 3 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(225,6,0,0.1)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E10600' },
  liveText: { color: '#E10600', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  rules: { marginHorizontal: 20, marginTop: 18, borderLeftWidth: 3, borderLeftColor: '#E10600', paddingLeft: 14, paddingVertical: 3 },
  rulesTitle: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  rulesText: { color: 'rgba(255,255,255,0.42)', fontSize: 12, lineHeight: 18, marginTop: 5 },
  dangerButton: { marginHorizontal: 20, marginTop: 30, minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,90,90,0.2)', backgroundColor: 'rgba(255,70,70,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dangerText: { color: '#ff6961', fontSize: 12, fontWeight: '800' },
});
