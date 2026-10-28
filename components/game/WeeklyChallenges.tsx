import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Flag, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { claimWeeklyChallenge, fetchWeeklyChallenges, type WeeklyChallenges as ChallengeList } from '@/lib/api/challenges';

export function WeeklyChallenges({ refreshKey = 0 }: { refreshKey?: number }) {
  const { accessToken, refreshProfile } = useAuth();
  const [data, setData] = useState<ChallengeList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!accessToken) return;
    let active = true;
    const load = async () => {
      try {
        const result = await fetchWeeklyChallenges(accessToken);
        if (active) { setData(result); setError(null); }
      } catch {
        if (active) setError('Impossible de charger les défis. Réessaie dans un instant.');
      }
    };
    void load();
    // Refreshes progress when a session starts and rolls over the week while open.
    const timer = setInterval(() => { void load(); }, 60000);
    return () => { active = false; clearInterval(timer); };
  }, [accessToken, refreshKey, reload]));

  const claim = async (id: string) => {
    if (!accessToken || !data || busy) return;
    setBusy(id);
    try {
      const result = await claimWeeklyChallenge(accessToken, id, data.week);
      setData(current => current ? { ...current, items: current.items.map(c => c.id === id ? { ...c, claimed: true } : c) } : current);
      await refreshProfile();
      if (result.rewarded > 0) Alert.alert('Défi accompli !', `+${result.rewarded} Jetons Paddock ajoutés à ton compte.`);
    } catch (e) {
      Alert.alert('Récompense indisponible', e instanceof Error ? e.message : 'Réessaie dans un instant.');
    } finally { setBusy(null); setReload(value => value + 1); }
  };

  if (!accessToken) return null;
  const availableRewards = data?.items.filter(challenge => challenge.completed && !challenge.claimed).length ?? 0;
  return (
    <View className="mb-8">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Défis de la semaine"
        accessibilityState={{ expanded }}
        accessibilityHint={expanded ? 'Masquer les défis' : 'Afficher les défis et leurs récompenses'}
        onPress={() => setExpanded(value => !value)}
        className="flex-row items-center gap-3 p-4 bg-[#0c0c0f] border border-white/10 rounded-2xl"
      >
        <Flag size={18} color="#00B4D8" />
        <View className="flex-1">
          <Text className="text-white font-black text-lg">Défis de la semaine</Text>
          {availableRewards > 0 && (
            <Text className="text-cyan-400 text-xs mt-1">
              {availableRewards} récompense{availableRewards > 1 ? 's' : ''} à récupérer
            </Text>
          )}
        </View>
        {expanded ? <ChevronUp size={20} color="#00B4D8" /> : <ChevronDown size={20} color="#00B4D8" />}
      </Pressable>
      {expanded && (
      <View className="mt-4">
      <Text className="text-white/50 text-xs mb-4">
        Renouvellement le lundi à 00 h UTC. Récupère tes Jetons Paddock avant la fin de la semaine.
      </Text>
      {error ? (
        <Pressable accessibilityRole="button" onPress={() => setReload(value => value + 1)} className="p-4 bg-white/5 rounded-2xl">
          <Text className="text-white/70">{error}</Text>
          <Text className="text-cyan-400 mt-2">Réessayer</Text>
        </Pressable>
      ) : !data ? <ActivityIndicator color="#00B4D8" /> : !data.enabled ? (
        <Text className="text-white/50">Les défis arrivent avec le lancement du championnat.</Text>
      ) : (
        <>
          {data.items.map(challenge => (
            <View key={challenge.id} className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-4 mb-3">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-white font-bold flex-1">{challenge.title}</Text>
                <Text className="text-cyan-400 font-bold">+{challenge.reward} jetons</Text>
              </View>
              <Text className="text-white/60 text-xs mt-2 mb-3">{challenge.description}</Text>
              <View accessibilityRole="progressbar" accessibilityLabel={challenge.title}
                accessibilityValue={{ min: 0, max: challenge.target, now: challenge.progress }}
                className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <View style={{ width: `${Math.min(100, challenge.progress / challenge.target * 100)}%` }} className="h-full bg-cyan-500" />
              </View>
              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-white/50 text-xs">{challenge.progress} / {challenge.target}</Text>
                {challenge.claimed ? (
                  <View className="flex-row items-center gap-1"><Check size={14} color="#4ADE80" /><Text className="text-green-400 text-xs">Récupéré</Text></View>
                ) : challenge.completed ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Récupérer ${challenge.reward} jetons pour ${challenge.title}`}
                    accessibilityState={{ disabled: busy !== null }} disabled={busy !== null}
                    onPress={() => claim(challenge.id)} className="bg-cyan-500/20 px-4 py-2 rounded-full">
                    {busy === challenge.id ? <ActivityIndicator size="small" color="#00B4D8" /> : <Text className="text-cyan-400 font-bold text-xs">Récupérer</Text>}
                  </Pressable>
                ) : <Text className="text-white/40 text-xs">En cours</Text>}
              </View>
            </View>
          ))}
          {!data.items.some(c => c.id === 'prono') && <Text className="text-white/40 text-xs">Le défi prono revient les semaines avec une session au calendrier.</Text>}
        </>
      )}
      </View>
      )}
    </View>
  );
}
