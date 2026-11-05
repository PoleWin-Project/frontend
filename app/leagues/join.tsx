import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, Flag, ShieldCheck } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { joinLeague, LeagueApiError } from '@/lib/api/leagues';

export default function JoinLeagueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { accessToken } = useAuth();
  const [code, setCode] = useState((params.code ?? '').toUpperCase());
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Le lien d'invitation ne doit tenter la connexion qu'une seule fois.
  const autoJoinAttempted = useRef(false);

  const submit = useCallback(async () => {
    if (!accessToken || !code.trim() || loading || done) return;
    setLoading(true);
    setError(null);
    try {
      const result = await joinLeague(code, accessToken);
      setDone(true);
      setTimeout(() => router.replace(`/leagues/${result.league.id}` as never), 650);
    } catch (e) {
      setError(e instanceof LeagueApiError ? e.message : 'Impossible de rejoindre cette Écurie.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, code, done, loading, router]);

  useEffect(() => {
    if (params.code && accessToken && !autoJoinAttempted.current) {
      autoJoinAttempted.current = true;
      void submit();
    }
  }, [accessToken, params.code, submit]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#2a0000', '#09090c', '#050507']} style={StyleSheet.absoluteFillObject} />
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.back}>
        <ChevronLeft size={24} color="#fff" />
      </Pressable>

      <Animated.View entering={ZoomIn.springify().damping(16)} style={styles.emblem}>
        {done ? <Check size={44} color="#fff" strokeWidth={3} /> : <Flag size={42} color="#fff" />}
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(80).springify()} style={styles.title}>
        {done ? 'PLACE SUR LA GRILLE CONFIRMÉE' : 'REJOINS LE PADDOCK'}
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(140).springify()} style={styles.subtitle}>
        {done ? 'Ton classement privé est prêt.' : 'Entre le code d’invitation transmis par le directeur de l’Écurie.'}
      </Animated.Text>

      {!done ? (
        <Animated.View entering={FadeInUp.delay(180).springify().damping(17)} style={styles.card}>
          <Text style={styles.label}>CODE D’ÉCURIE</Text>
          <TextInput
            value={code}
            onChangeText={value => { setCode(value.toUpperCase()); setError(null); }}
            placeholder="PW7K4X2A"
            placeholderTextColor="rgba(255,255,255,0.2)"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={16}
            returnKeyType="go"
            onSubmitEditing={() => { void submit(); }}
            style={[styles.input, error ? styles.inputError : null]}
          />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Pressable disabled={!code.trim() || loading} onPress={() => { void submit(); }} style={[styles.button, (!code.trim() || loading) && styles.disabled]}>
            {loading ? <ActivityIndicator color="#fff" /> : <><ShieldCheck size={19} color="#fff" /><Text style={styles.buttonText}>Valider mon accès</Text></>}
          </Pressable>
          <Text style={styles.hint}>Le code ne donne accès qu’au classement et aux membres de cette Écurie. Tes autres données restent privées.</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  back: { position: 'absolute', left: 20, top: 58, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  emblem: { width: 92, height: 92, borderRadius: 28, backgroundColor: '#E10600', alignItems: 'center', justifyContent: 'center', shadowColor: '#E10600', shadowOpacity: 0.5, shadowRadius: 25, shadowOffset: { width: 0, height: 10 } },
  title: { color: '#fff', fontFamily: 'Montserrat_Bold_Italic', fontSize: 27, textAlign: 'center', lineHeight: 31, marginTop: 25 },
  subtitle: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20, maxWidth: 330, marginTop: 9 },
  card: { width: '100%', backgroundColor: 'rgba(12,12,15,0.95)', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(225,6,0,0.28)', padding: 20, marginTop: 28 },
  label: { color: '#E10600', fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginBottom: 9 },
  input: { height: 60, borderRadius: 16, backgroundColor: '#050507', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', textAlign: 'center', fontFamily: 'Montserrat_Bold', fontSize: 22, letterSpacing: 4 },
  inputError: { borderColor: '#E10600' },
  error: { color: '#ff6961', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 9 },
  button: { height: 54, borderRadius: 16, backgroundColor: '#E10600', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 13 },
  disabled: { opacity: 0.42 },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  hint: { color: 'rgba(255,255,255,0.32)', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 14 },
});
