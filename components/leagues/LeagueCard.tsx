import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Crown, Shield, Users } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import type { LeagueSummary } from '@/lib/api/leagues';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ACCENTS = ['#E10600', '#00A19C', '#FF8700', '#3671C6', '#6CD3BF', '#B6BABD'];

export function leagueAccent(id: number) {
  return ACCENTS[Math.abs(id) % ACCENTS.length];
}

export function LeagueCard({ league, index, onPress }: { league: LeagueSummary; index: number; onPress: () => void }) {
  const accent = leagueAccent(league.id);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir l’Écurie ${league.name}, ${league.memberCount} membres`}
      entering={FadeInRight.delay(Math.min(index * 70, 420)).springify().damping(16)}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[styles.card, animatedStyle]}
    >
      <LinearGradient colors={[`${accent}2a`, 'rgba(12,12,15,0.98)']} start={{ x: 0, y: 0 }} end={{ x: 0.75, y: 0.7 }} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.numberPlate, { borderColor: `${accent}70` }]}>
        <Shield size={21} color={accent} fill={`${accent}22`} />
        <Text style={[styles.number, { color: accent }]}>{String(league.id).padStart(2, '0').slice(-2)}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.roleRow}>
          {league.role === 'owner' ? <Crown size={12} color="#FFD166" /> : <Users size={12} color="rgba(255,255,255,0.5)" />}
          <Text style={styles.role}>{league.role === 'owner' ? 'DIRECTEUR' : 'PILOTE'}</Text>
        </View>
        <Text numberOfLines={1} style={styles.name}>{league.name}</Text>
        <Text style={styles.meta}>{league.memberCount} membre{league.memberCount > 1 ? 's' : ''} · {league.scoringMode === 'from_join' ? 'Nouveau départ' : `Saison ${league.seasonYear}`}</Text>
      </View>
      <ChevronRight size={22} color="rgba(255,255,255,0.28)" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 104, borderRadius: 22, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  numberPlate: { width: 62, height: 68, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.36)', borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  number: { fontFamily: 'Montserrat_Bold_Italic', fontSize: 18, marginTop: 2 },
  content: { flex: 1, minWidth: 0 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  role: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  name: { color: '#fff', fontFamily: 'Montserrat_Bold', fontSize: 18 },
  meta: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600', marginTop: 5 },
});
