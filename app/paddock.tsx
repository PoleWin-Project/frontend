import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Database } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { PilotAvatar } from '@/components/paddock/PilotAvatar';
import { PaddockShopItem } from '@/components/paddock/PaddockShopItem';
import { useAuth } from '@/context/AuthContext';
import { buyCosmetic, equipCosmetic, fetchPaddock, type PaddockCatalog, type PaddockItem, type CosmeticKind } from '@/lib/api/paddock';

const FILTERS: { kind: CosmeticKind | 'all'; label: string }[] = [
  { kind: 'all', label: 'Tout' }, { kind: 'helmet', label: 'Casques' },
  { kind: 'suit', label: 'Tenues' }, { kind: 'title', label: 'Titres' },
  { kind: 'background', label: 'Fonds' }, { kind: 'frame', label: 'Cadres' },
];
const BOX = require('../assets/images/paddock/garage-box-2d.png');
const CAR = require('../assets/images/paddock/garage-car-2d.png');

export default function PaddockScreen() {
  const { user, accessToken, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [fontLoaded] = useFonts({ PaddockDisplay: require('@expo-google-fonts/montserrat/900Black_Italic/Montserrat_900Black_Italic.ttf') });
  const display = { fontFamily: fontLoaded ? 'PaddockDisplay' : 'Montserrat_Bold_Italic' };
  const pageWidth = Math.min(width, 820);
  const padding = width < 375 ? 12 : 18;
  const itemWidth = (pageWidth - padding * 2 - 26 - 10) / 2;
  const [filter, setFilter] = useState<CosmeticKind | 'all'>('all');
  const [data, setData] = useState<PaddockCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'shop' | 'collection'>('shop');
  const [reload, setReload] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!accessToken) { setData(null); return; }
    let active = true;
    setData(null);
    fetchPaddock(accessToken).then(result => { if (active) { setData(result); setError(null); } })
      .catch(() => { if (active) setError('Impossible de charger le Paddock. Réessaie dans un instant.'); });
    return () => { active = false; };
  }, [accessToken, reload]));

  // Actualise une boutique laissée ouverte au passage du lundi.
  useEffect(() => {
    if (!data?.rotation.refreshesAt) return;
    const delay = Math.max(1000, new Date(data.rotation.refreshesAt).getTime() - Date.now() + 100);
    const timer = setTimeout(() => setReload(n => n + 1), delay);
    return () => clearTimeout(timer);
  }, [data?.rotation.refreshesAt]);

  const refresh = async () => {
    if (!accessToken) return;
    setRefreshing(true);
    try { setData(await fetchPaddock(accessToken)); setError(null); await refreshProfile(); }
    catch { setError('Impossible d’actualiser le Paddock.'); }
    finally { setRefreshing(false); }
  };
  const act = async (item: PaddockItem) => {
    if (!accessToken || busy) return;
    setBusy(item.code);
    try {
      if (item.owned) await equipCosmetic(accessToken, item.kind, item.equipped ? null : item.code);
      else await buyCosmetic(accessToken, item.code);
      setData(await fetchPaddock(accessToken));
      await refreshProfile();
      if (!item.owned) Alert.alert('Ajouté à ta collection', `${item.name} est à toi ! Tu peux maintenant l’équiper.`);
    } catch (e) {
      Alert.alert('Action impossible', e instanceof Error ? e.message : 'Réessaie dans un instant.');
      // A purchase may have succeeded even if its response was interrupted.
      try { setData(await fetchPaddock(accessToken)); await refreshProfile(); } catch { /* retry remains available */ }
    } finally { setBusy(null); }
  };
  const appearance = data?.cosmetics ?? user?.cosmetics;
  const visibleItems = data?.items.filter(item => (tab === 'shop' ? item.available : item.owned)
    && (filter === 'all' || item.kind === filter)) ?? [];
  const rotationDate = data ? new Date(data.rotation.refreshesAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  }) : '';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom, alignItems: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#ff2536" />}>
        <View style={{ width: pageWidth }}>
          <View style={styles.intro}>
            <Image accessible={false} source={BOX} style={styles.decorImage} resizeMode="cover" />
            <LinearGradient pointerEvents="none" colors={['#07090bb0', '#07090b88', '#07090b']} style={StyleSheet.absoluteFillObject} />
            <View style={{ paddingTop: 12, paddingHorizontal: padding }}>
              <View style={styles.brandRow}>
                <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.back}>
                  <ChevronLeft color="white" size={22} />
                </Pressable>
              </View>
              <Text accessibilityRole="header" style={[styles.heading, display, { fontSize: pageWidth < 375 ? 32 : 39, lineHeight: pageWidth < 375 ? 44 : 52 }]}>LE PADDOCK<Text style={[styles.slashes, display]}> ///</Text></Text>
              <Text style={styles.subtitle}>La signature de ton pilote.</Text>
              {accessToken && <LinearGradient colors={['#151b1f', '#090c0f']} style={styles.pass}>
                <PilotAvatar appearance={appearance} size={58} label={user?.username} />
                <View style={styles.identity}>
                  <Text style={styles.username}>{user?.username}</Text>
                  <Text style={styles.signature}>{appearance?.title?.name ?? 'Choisis ta signature'}</Text>
                </View>
                <View style={styles.balance}>
                  <View style={styles.balanceValue}><Database size={22} color="#ff2536" /><Text style={styles.amount}>{(data?.garageCredits ?? user?.garageCredits ?? 0).toLocaleString('fr-FR')}</Text></View>
                  <Text style={styles.tokenLabel}>jetons</Text>
                </View>
              </LinearGradient>}
            </View>
          </View>

          {!accessToken ? <View style={[styles.panel, { margin: padding }]}>
            <Text style={styles.body}>Connecte-toi pour personnaliser ton profil.</Text>
            <Pressable onPress={() => router.push('/sign-in')} accessibilityRole="button" style={styles.login}><Text style={styles.loginText}>Se connecter</Text></Pressable>
          </View> : <>
            <View accessibilityRole="tablist" style={[styles.tabs, { marginHorizontal: padding }]}>
              {(['shop', 'collection'] as const).map(value => <Pressable key={value}
                accessibilityRole="tab" accessibilityState={{ selected: tab === value }}
                onPress={() => { setTab(value); setFilter('all'); }}
                style={[styles.tab, tab === value && styles.tabSelected]}>
                <Text style={[styles.tabText, display, tab === value && styles.tabTextSelected]}>{value === 'shop' ? 'BOUTIQUE' : 'MA COLLECTION'}</Text>
              </Pressable>)}
            </View>
            <View style={[styles.box, { height: pageWidth < 375 ? 174 : 196 }]}>
              <Image accessible={false} source={BOX} style={styles.decorImage} resizeMode="cover" />
              <LinearGradient pointerEvents="none" colors={['#07090b00', '#07090b66', '#07090b']} style={StyleSheet.absoluteFillObject} />
              <LinearGradient pointerEvents="none" colors={['#07090bbb', '#07090b00']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              <View style={[styles.boxCopy, { left: padding + 12 }]}>
                <Text style={[styles.boxTitle, display]}>TON BOX.{'\n'}TON STYLE.</Text>
                <Text style={styles.boxSubtitle}>Prépare ton pilote.</Text>
              </View>
              <View pointerEvents="none" style={{ position: 'absolute', right: padding - 8, bottom: -12 }}>
                <PilotAvatar appearance={appearance} size={pageWidth < 375 ? 178 : 206} presentation="driver" zoomable={false} />
              </View>
            </View>

            <View style={[styles.panel, { marginHorizontal: padding }]}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, display]}>{tab === 'shop' ? 'LA SÉLECTION' : 'MA COLLECTION'}<Text style={[styles.sectionSlashes, display]}> ///</Text></Text>
              <Text style={styles.rotation}>{tab === 'shop' ? data ? `Rotation le ${rotationDate} · 00 h UTC` : 'La sélection de la semaine' : 'Tes équipements, pour toutes les saisons.'}</Text>
              {error && <View accessibilityRole="alert" style={styles.notice}><Text style={styles.body}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setReload(n => n + 1)} style={styles.retry}><Text style={styles.retryText}>Réessayer</Text></Pressable></View>}
              {!data && !error && <View style={styles.loading}><ActivityIndicator color="#ff2536" /><Text style={styles.rotation}>Ouverture du box…</Text></View>}
              {data && <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                  {FILTERS.map(({ kind, label }) => <Pressable key={kind} accessibilityRole="button" accessibilityState={{ selected: filter === kind }}
                    onPress={() => setFilter(kind)} style={[styles.filter, filter === kind && styles.filterSelected]}>
                    <Text style={[styles.filterText, filter === kind && styles.filterTextSelected]}>{label}</Text>
                  </Pressable>)}
                </ScrollView>
                {!data.enabled && <Text style={styles.noticeText}>Les achats ouvrent au lancement du championnat.</Text>}
                {visibleItems.length === 0 && <Text style={styles.empty}>{tab === 'collection'
                  ? filter === 'all' ? 'Ta collection est vide. Ton pilote de base est gratuit. Personnalise-le avec la sélection de la semaine.' : 'Tu ne possèdes pas encore d’équipement dans cette catégorie.'
                  : 'Aucun article de cette catégorie cette semaine. Découvre les autres équipements.'}</Text>}
                <View style={styles.grid}>
                  {visibleItems.map(item => <PaddockShopItem key={item.code} item={item} appearance={data.cosmetics}
                    balance={data.garageCredits} enabled={data.enabled} busy={busy} width={itemWidth} onAction={act} />)}
                </View>
              </>}
              <View style={styles.footnote}><View style={styles.rule} /><Text style={styles.footnoteText}>Ton style en piste.{'\n'}Aucun effet sur le classement.</Text><View style={styles.rule} /></View>
            </View>
            <View pointerEvents="none" style={{ height: pageWidth * 0.57, marginTop: -1 }}>
              <Image accessible={false} source={CAR} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <LinearGradient colors={['#07090b', '#07090b00']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40 }} />
            </View>
          </>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  decorImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  screen: { flex: 1, backgroundColor: '#07090b' },
  intro: { overflow: 'hidden', paddingBottom: 10 },
  brandRow: { height: 44, flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080b0ecc', borderWidth: 1, borderColor: '#ffffff24', borderRadius: 22 },
  heading: { color: '#fff', textAlign: 'center', letterSpacing: -1.9, marginTop: 7 },
  slashes: { color: '#ff2536', fontSize: 34, lineHeight: 48, letterSpacing: -4 },
  subtitle: { color: '#e0e3e5', fontSize: 15, textAlign: 'center', marginTop: 1, marginBottom: 18 },
  pass: { padding: 12, borderWidth: 1, borderColor: '#596168', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  identity: { flex: 1 },
  username: { color: '#fff', fontFamily: 'Inter_Bold', fontSize: 17 },
  signature: { color: '#c0c6ca', fontSize: 11, marginTop: 4 },
  balance: { borderLeftWidth: 1, borderColor: '#4a5259', paddingLeft: 12, alignItems: 'center' },
  balanceValue: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  amount: { fontFamily: 'Inter_Bold', color: '#fff', fontSize: 25 },
  tokenLabel: { color: '#c0c6ca', fontSize: 11 },
  tabs: { flexDirection: 'row', borderWidth: 1, borderColor: '#444b50', backgroundColor: '#101518' },
  tab: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: 'transparent', paddingHorizontal: 4 },
  tabSelected: { borderBottomColor: '#ff2536', backgroundColor: '#ff25360a' },
  tabText: { color: '#adb3b8', fontSize: 15, letterSpacing: -0.7 },
  tabTextSelected: { color: '#ff2536' },
  box: { overflow: 'hidden', borderTopWidth: 4, borderTopColor: '#30383c' },
  boxCopy: { position: 'absolute', bottom: 25, zIndex: 1 },
  boxTitle: { color: '#fff', fontSize: 26, lineHeight: 28, letterSpacing: -1.4 },
  boxSubtitle: { color: '#cdd2d6', fontSize: 12, marginTop: 6 },
  panel: { backgroundColor: '#0b0f12', borderWidth: 1, borderColor: '#596168', borderRadius: 10, padding: 12 },
  sectionTitle: { color: '#fff', fontSize: 23, lineHeight: 34, letterSpacing: -1.1 },
  sectionSlashes: { color: '#ff2536', fontSize: 25, lineHeight: 34, letterSpacing: -3 },
  rotation: { color: '#b9c0c6', fontSize: 12, marginTop: 4 },
  filters: { gap: 7, paddingVertical: 14 },
  filter: { borderWidth: 1, borderColor: '#596168', borderRadius: 10, minHeight: 44, minWidth: 64, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  filterSelected: { backgroundColor: '#f7192b', borderColor: '#f7192b' },
  filterText: { color: '#d8dde0', fontSize: 12 },
  filterTextSelected: { color: '#fff', fontFamily: 'Inter_Bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footnote: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 2 },
  rule: { height: 1, backgroundColor: '#6d7479', flex: 1 },
  footnoteText: { color: '#abb3ba', textAlign: 'center', fontSize: 10, lineHeight: 15 },
  body: { color: '#d8dde0', fontSize: 14 },
  empty: { color: '#c0c7cd', fontSize: 13, lineHeight: 20, paddingVertical: 20 },
  loading: { padding: 30, gap: 10, alignItems: 'center' },
  notice: { marginTop: 14, padding: 12, backgroundColor: '#301318', borderRadius: 8 },
  noticeText: { color: '#dcc2c5', fontSize: 12, marginBottom: 14 },
  retry: { minHeight: 44, justifyContent: 'center' },
  retryText: { color: '#ff6470', fontFamily: 'Inter_Bold', fontSize: 14 },
  login: { backgroundColor: '#f7192b', padding: 14, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  loginText: { color: '#fff', fontFamily: 'Inter_Bold' },
});
