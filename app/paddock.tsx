import { PilotAvatar } from '@/components/paddock/PilotAvatar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Flag, Check, Trophy, Radio, Gauge } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { buyCosmetic, equipCosmetic, fetchPaddock, type PaddockCatalog, type PaddockItem, type Appearance } from '@/lib/api/paddock';

const kindLabels = { helmet: 'Casque', suit: 'Tenue', background: 'Fond', frame: 'Cadre', title: 'Titre' };

export default function PaddockScreen() {
  const { user, accessToken, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 350 || fontScale > 1.3 ? 2 : 3;
  const itemWidth = (width - 40 - (columns - 1) * 8) / columns;
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
  return (
    <View className="flex-1 bg-[#08090b]" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-5 py-2">
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} className="p-3 rounded-full bg-white/5">
          <ChevronLeft color="white" size={20} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-bold text-2xl">Le Paddock</Text>
          <Text className="text-white/50 text-xs">La signature de ton pilote.</Text>
        </View>
      </View>
      {!accessToken ? (
        <View className="p-6"><Text className="text-white mb-4">Connecte-toi pour personnaliser ton profil.</Text><Pressable onPress={() => router.push('/sign-in')} accessibilityRole="button"><Text className="text-cyan-400">Se connecter</Text></Pressable></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#00B4D8" />}>
          <LinearGradient colors={['#18242c', '#101419', '#111317']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#ffffff12', marginBottom: 12 }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white/50 text-xs tracking-widest">PASS PADDOCK</Text>
              <Flag size={14} color="#7e929f" />
            </View>
            <View className="flex-row items-center gap-3">
              <PilotAvatar appearance={data?.cosmetics ?? user?.cosmetics} size={64} />
              <View className="flex-1">
                <Text numberOfLines={1} className="text-white font-bold text-sm">{user?.username}</Text>
                <Text className="text-white/50 text-xs mt-1">{data?.cosmetics.title?.name ?? 'Choisis ta signature'}</Text>
              </View>
              <View className="items-end border-l border-white/10 pl-3">
                <Text className="text-white font-bold text-2xl">{(data?.garageCredits ?? user?.garageCredits ?? 0).toLocaleString()}</Text>
                <Text className="text-white/50 text-xs">jetons</Text>
              </View>
            </View>
          </LinearGradient>
          {error ? <Pressable accessibilityRole="button" onPress={() => setReload(n => n + 1)} className="p-4 mb-4"><Text className="text-white">{error}</Text><Text className="text-cyan-400 mt-2">Réessayer</Text></Pressable> : null}
          {!data && !error ? <ActivityIndicator color="#00B4D8" /> : data ? (
            <>
              <View className="flex-row border-b border-white/10 mb-4">
                {(['shop', 'collection'] as const).map(value => (
                  <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={{ minHeight: 44 }} className={`flex-1 justify-center border-b-2 ${tab === value ? 'border-white' : 'border-transparent'}`}>
                    <Text className={`text-center font-bold text-sm ${tab === value ? 'text-white' : 'text-white/40'}`}>{value === 'shop' ? 'Boutique' : 'Ma collection'}</Text>
                  </Pressable>
                ))}
              </View>
              {!data.enabled && <Text className="text-white/60 mb-4">Les achats ouvrent au lancement du championnat.</Text>}
              {tab === 'collection' && !data.items.some(item => item.owned) && <Text className="text-white/50">Ta collection est vide. Ton pilote de base est gratuit. Personnalise-le avec la sélection de la semaine.</Text>}
              <View className="mb-3">
                <Text className="text-white font-bold text-sm">{tab === 'shop' ? 'La sélection de la semaine' : 'Tes personnalisations'}</Text>
                <Text className="text-white/50 text-xs mt-1">{tab === 'shop'
                  ? `Renouvellement le ${new Date(data.rotation.refreshesAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} · lundi à 00 h UTC`
                  : 'Tes achats restent disponibles, même hors sélection.'}</Text>
              </View>
              <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
                      {data.items.filter(item => tab === 'shop' ? item.available : item.owned).map(item => {
                        const affordable = data.garageCredits >= item.price;
                        const disabled = busy !== null || (!item.owned && (!data.enabled || !affordable));
                        const preview: Appearance = { ...data.cosmetics, [item.kind]: { code: item.code, name: item.name, color: item.color } };
                        const TitleIcon = item.code === 'title-strategist' ? Radio : item.code === 'title-late-braker' ? Gauge : Trophy;
                        return (
                          <View key={item.code} style={{ width: itemWidth, borderColor: item.equipped ? '#507579' : '#ffffff0c', borderWidth: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#121519' }}>
                            <LinearGradient colors={item.kind !== 'title' ? ['#20272f', '#121519'] : ['#28251f', '#121519']} style={{ height: 86, alignItems: 'center', justifyContent: 'center' }}>
                              {item.kind !== 'title' ? (
                                <PilotAvatar appearance={preview} size={78} />
                              ) : (
                                <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: '#c6a8750c', borderWidth: 1, borderColor: '#c6a87525', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }}>
                                  <TitleIcon color="#c6a875" size={26} strokeWidth={1.5} />
                                </View>
                              )}
                              {item.equipped && <View accessibilityLabel="Équipé" style={{ position: 'absolute', right: 7, top: 7, backgroundColor: '#193136', padding: 3, borderRadius: 10 }}><Check color="#83ced0" size={12} /></View>}
                            </LinearGradient>
                            <View className="px-2 pb-2 flex-1">
                              <Text className="text-white/40 text-center" style={{ fontSize: 10, marginBottom: 3 }}>{kindLabels[item.kind]}</Text>
                              <Text style={{ minHeight: 34, lineHeight: 17, fontSize: 12, textAlign: 'center', color: '#e6e9ed', fontWeight: '600' }}>{item.name}</Text>
                              <Pressable accessibilityRole="button" accessibilityLabel={`${item.owned ? item.equipped ? 'Retirer' : 'Équiper' : `Acheter pour ${item.price} jetons`} : ${item.name}`} accessibilityHint={!item.owned && !affordable ? `Il te manque ${item.price - data.garageCredits} jetons.` : undefined} accessibilityState={{ disabled, busy: busy === item.code }} disabled={disabled} onPress={() => act(item)}
                                style={{ minHeight: 44, marginTop: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: item.equipped ? '#1a2c30' : disabled ? '#ffffff04' : '#ffffff0c' }}>
                                {busy === item.code ? <ActivityIndicator color="#83ced0" /> : <Text style={{ fontSize: 12, fontWeight: '600', color: disabled ? '#727a85' : item.equipped ? '#83ced0' : '#e6e9ed' }}>{item.owned ? item.equipped ? 'Retirer' : 'Équiper' : `${item.price} jetons`}</Text>}
                              </Pressable>
                            </View>
                          </View>
                        );
                      })}
              </View>
              <Text className="text-white/40 text-xs text-center">Ton style en piste. Aucun effet sur le classement.</Text>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
