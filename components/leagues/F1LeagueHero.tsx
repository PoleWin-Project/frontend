import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Flag, Plus, Ticket } from 'lucide-react-native';
import { Text } from '@/components/ui/text';

const CHECKERS = Array.from({ length: 24 }, (_, index) => index);

interface F1LeagueHeroProps {
  onCreate: () => void;
  onJoin: () => void;
}

export function F1LeagueHero({ onCreate, onJoin }: F1LeagueHeroProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(progress);
  }, [progress]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-140, 420]) }],
    opacity: interpolate(progress.value, [0, 0.15, 0.85, 1], [0, 0.8, 0.8, 0]),
  }));

  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.hero}>
      <LinearGradient colors={['#260000', '#0d0d10', '#050507']} style={StyleSheet.absoluteFillObject} />
      <View pointerEvents="none" style={styles.checkerGrid}>
        {CHECKERS.map(index => (
          <View key={index} style={[styles.checker, (index + Math.floor(index / 6)) % 2 === 0 && styles.checkerOn]} />
        ))}
      </View>
      <Animated.View pointerEvents="none" style={[styles.speedLine, lineStyle]} />

      <View style={styles.eyebrow}>
        <Flag size={13} color="#fff" />
        <Text style={styles.eyebrowText}>COMPÉTITION PRIVÉE</Text>
      </View>
      <Text style={styles.title}>MÊME PASSION.{`\n`}VOTRE CLASSEMENT.</Text>
      <Text style={styles.subtitle}>
        Réunis tes amis sur une même grille et visez la première place entre vous.
      </Text>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Créer une Écurie" onPress={onCreate} style={styles.primaryButton}>
          <Plus size={18} color="#fff" strokeWidth={3} />
          <Text style={styles.primaryText}>Créer</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Rejoindre une Écurie" onPress={onJoin} style={styles.secondaryButton}>
          <Ticket size={18} color="#fff" />
          <Text style={styles.secondaryText}>Rejoindre</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24, padding: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(225,6,0,0.35)',
    shadowColor: '#E10600', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10,
  },
  checkerGrid: {
    position: 'absolute', right: -15, top: -10, width: 180, height: 120,
    flexDirection: 'row', flexWrap: 'wrap', opacity: 0.08, transform: [{ rotate: '-12deg' }],
  },
  checker: { width: 30, height: 30 },
  checkerOn: { backgroundColor: '#fff' },
  speedLine: { position: 'absolute', top: 126, width: 120, height: 2, backgroundColor: '#E10600', shadowColor: '#E10600', shadowOpacity: 1, shadowRadius: 8 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: '#E10600', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 20 },
  eyebrowText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#fff', fontFamily: 'Montserrat_Bold_Italic', fontSize: 26, lineHeight: 31, letterSpacing: -0.8 },
  subtitle: { color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 310 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  primaryButton: { flex: 1, minHeight: 50, borderRadius: 16, backgroundColor: '#E10600', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  secondaryButton: { flex: 1, minHeight: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { color: '#fff', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
});
