import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { AlertCircle, ChevronLeft, CircleCheck, Flag, Gauge, ShieldCheck, TimerReset, Trophy, Users, X } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { F1LeagueHero } from '@/components/leagues/F1LeagueHero';
import { LeagueCard } from '@/components/leagues/LeagueCard';
import { useAuth } from '@/context/AuthContext';
import { createLeague, fetchMyLeagues, joinLeague, LeagueApiError, type LeagueScoringMode, type LeagueSummary } from '@/lib/api/leagues';

type FormMode = 'create' | 'join' | null;

const STEPS = [
  { icon: Flag, title: 'Crée ou rejoins', text: 'Un code privé suffit pour entrer dans le paddock.' },
  { icon: Gauge, title: 'Retrouve tes points', text: 'Tes points déjà gagnés cette saison sont repris. Les prochains pronos comptent aussi.' },
  { icon: CircleCheck, title: 'Passe devant', text: 'Le classement évolue après chaque session résolue.' },
];

function friendlyError(error: unknown) {
  if (error instanceof LeagueApiError) return error.message;
  return 'Connexion impossible. Vérifie le serveur puis réessaie.';
}

export default function LeaguesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scoringMode, setScoringMode] = useState<LeagueScoringMode>('from_join');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      setLeagues(await fetchMyLeagues(accessToken));
      setError(null);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const openForm = useCallback((mode: Exclude<FormMode, null>) => {
    setFormMode(mode);
    setValue('');
    if (mode === 'create') setScoringMode('from_join');
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    const input = value.trim();
    if (!accessToken || submitting || !formMode) return;
    if (formMode === 'create' && input.length < 3) {
      setError('Le nom de l’Écurie doit contenir au moins 3 caractères.');
      return;
    }
    if (formMode === 'join' && input.length < 6) {
      setError('Le code d’invitation doit contenir au moins 6 caractères.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const league = formMode === 'create'
        ? await createLeague(input, scoringMode, accessToken)
        : (await joinLeague(input, accessToken)).league;
      setFormMode(null);
      setValue('');
      router.push(`/leagues/${league.id}` as never);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSubmitting(false);
    }
  }, [accessToken, formMode, router, scoringMode, submitting, value]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour au classement" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/classement')} style={styles.backButton}>
            <ChevronLeft size={23} color="#fff" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>LE PADDOCK PRIVÉ</Text>
            <Text accessibilityRole="header" style={styles.headerTitle}>Mes Écuries</Text>
          </View>
          <ShieldCheck size={24} color="#E10600" />
        </View>
      </SafeAreaView>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />}
      >
        <F1LeagueHero onCreate={() => openForm('create')} onJoin={() => openForm('join')} />

        {error && !formMode ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.errorBanner}>
            <View style={styles.errorBannerCopy}>
              <Text style={styles.errorBannerTitle}>Drapeau jaune</Text>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => { void load(); }} style={styles.retryButton}>
              <Text style={styles.retryText}>Réessayer</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {formMode ? (
          <Animated.View entering={FadeInDown.springify()} exiting={FadeOutUp} layout={Layout.springify()} style={styles.formCard}>
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.formTitle}>{formMode === 'create' ? 'Nouvelle Écurie' : 'Accès au paddock'}</Text>
                <Text style={styles.formSubtitle}>
                  {formMode === 'create' ? 'Choisis un nom mémorable pour ton groupe.' : 'Saisis le code partagé par le directeur.'}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => { setFormMode(null); setError(null); }} style={styles.closeButton}>
                <X size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <TextInput
              autoFocus
              value={value}
              onChangeText={text => { setValue(formMode === 'join' ? text.toUpperCase() : text); setError(null); }}
              placeholder={formMode === 'create' ? 'Ex. Les Freins Tardifs' : 'Ex. PW7K4X2A'}
              placeholderTextColor="rgba(255,255,255,0.28)"
              maxLength={formMode === 'create' ? 32 : 16}
              autoCapitalize={formMode === 'create' ? 'sentences' : 'characters'}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => { void submit(); }}
              style={[styles.input, error ? styles.inputError : null]}
            />
            {formMode === 'create' ? (
              <View style={styles.modeSection}>
                <Text style={styles.modeLabel}>DÉPART DU CLASSEMENT</Text>
                <View style={styles.modeOptions}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: scoringMode === 'from_join' }}
                    onPress={() => setScoringMode('from_join')}
                    style={[styles.modeCard, scoringMode === 'from_join' && styles.modeCardActive]}
                  >
                    <View style={[styles.modeIcon, scoringMode === 'from_join' && styles.modeIconActive]}><TimerReset size={19} color={scoringMode === 'from_join' ? '#fff' : '#E10600'} /></View>
                    <Text style={styles.modeTitle}>Nouveau championnat</Text>
                    <Text style={styles.modeText}>Chaque pilote commence à 0 en rejoignant l’Écurie.</Text>
                    <Text style={styles.recommended}>RECOMMANDÉ</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: scoringMode === 'season' }}
                    onPress={() => setScoringMode('season')}
                    style={[styles.modeCard, scoringMode === 'season' && styles.modeCardActive]}
                  >
                    <View style={[styles.modeIcon, scoringMode === 'season' && styles.modeIconActive]}><Trophy size={19} color={scoringMode === 'season' ? '#fff' : '#E10600'} /></View>
                    <Text style={styles.modeTitle}>Saison actuelle</Text>
                    <Text style={styles.modeText}>Les points déjà gagnés sont conservés.</Text>
                  </Pressable>
                </View>
                <Text style={styles.modeHint}>Ce choix devient définitif après la création.</Text>
              </View>
            ) : null}
            {error ? (
              <Animated.View entering={FadeInDown.duration(180)} accessibilityRole="alert" style={styles.formError}>
                <AlertCircle size={18} color="#ff6b67" />
                <View style={styles.formErrorCopy}>
                  <Text style={styles.formErrorTitle}>Vérifie ta saisie</Text>
                  <Text style={styles.error}>{error}</Text>
                </View>
              </Animated.View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={!value.trim() || submitting}
              onPress={() => { void submit(); }}
              style={[styles.submitButton, (!value.trim() || submitting) && styles.submitDisabled]}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : (
                <>
                  {formMode === 'create' ? <Flag size={18} color="#fff" /> : <ShieldCheck size={18} color="#fff" />}
                  <Text style={styles.submitText}>{formMode === 'create' ? 'Créer mon Écurie' : 'Rejoindre l’Écurie'}</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>TON PADDOCK</Text>
            <Text style={styles.sectionTitle}>Mes championnats</Text>
          </View>
          <View style={styles.countPill}><Users size={13} color="#E10600" /><Text style={styles.countText}>{leagues.length}</Text></View>
        </View>

        {loading ? (
          <View style={styles.loader}><ActivityIndicator size="large" color="#E10600" /></View>
        ) : leagues.length ? leagues.map((league, index) => (
          <LeagueCard key={league.id} league={league} index={index} onPress={() => router.push(`/leagues/${league.id}` as never)} />
        )) : (
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.empty}>
            <View style={styles.emptyIcon}><Flag size={30} color="#E10600" /></View>
            <Text style={styles.emptyTitle}>La grille est vide</Text>
            <Text style={styles.emptyText}>Crée ta première Écurie ou utilise le code d’un ami pour commencer la compétition.</Text>
          </Animated.View>
        )}

        <View style={styles.howCard}>
          <Text style={styles.howEyebrow}>COMMENT ÇA MARCHE ?</Text>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <View key={step.title} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>0{index + 1}</Text></View>
                  {index < STEPS.length - 1 ? <View style={styles.railLine} /> : null}
                </View>
                <View style={styles.stepIcon}><Icon size={18} color="#E10600" /></View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050507' },
  headerSafeArea: { backgroundColor: '#050507', flexShrink: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  backButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#151518', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerEyebrow: { color: '#ff625b', fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  headerTitle: { color: '#fff', fontFamily: 'Montserrat_Bold_Italic', fontSize: 25, marginTop: 3 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 80 },
  formCard: { backgroundColor: '#0d0d10', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(225,6,0,0.3)', padding: 18, marginTop: 16 },
  errorBanner: { marginTop: 14, padding: 14, borderRadius: 17, backgroundColor: 'rgba(255,193,7,0.08)', borderWidth: 1, borderColor: 'rgba(255,193,7,0.24)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorBannerCopy: { flex: 1 },
  errorBannerTitle: { color: '#FFD166', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  errorBannerText: { color: 'rgba(255,255,255,0.58)', fontSize: 11, lineHeight: 16, marginTop: 3 },
  retryButton: { borderRadius: 11, backgroundColor: 'rgba(255,209,102,0.12)', paddingHorizontal: 11, paddingVertical: 9 },
  retryText: { color: '#FFD166', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  formTitle: { color: '#fff', fontFamily: 'Montserrat_Bold', fontSize: 18 },
  formSubtitle: { color: 'rgba(255,255,255,0.48)', fontSize: 12, marginTop: 4, maxWidth: 270 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  input: { height: 54, borderRadius: 15, backgroundColor: '#050507', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 16, fontSize: 16, fontWeight: '700' },
  inputError: { borderColor: '#E10600' },
  modeSection: { marginTop: 16 },
  modeLabel: { color: 'rgba(255,255,255,0.42)', fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginBottom: 9 },
  modeOptions: { flexDirection: 'row', gap: 9 },
  modeCard: { flex: 1, minHeight: 148, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: '#08080a', padding: 12 },
  modeCardActive: { borderColor: '#E10600', backgroundColor: 'rgba(225,6,0,0.08)' },
  modeIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(225,6,0,0.1)', marginBottom: 10 },
  modeIconActive: { backgroundColor: '#E10600' },
  modeTitle: { color: '#fff', fontSize: 12, fontWeight: '900', lineHeight: 16 },
  modeText: { color: 'rgba(255,255,255,0.45)', fontSize: 10, lineHeight: 14, marginTop: 5 },
  recommended: { color: '#ff625b', fontSize: 7, fontWeight: '900', letterSpacing: 0.8, marginTop: 8 },
  modeHint: { color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', marginTop: 9 },
  formError: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,107,103,0.3)', backgroundColor: 'rgba(255,107,103,0.08)', padding: 11 },
  formErrorCopy: { flex: 1 },
  formErrorTitle: { color: '#ff8a86', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  error: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '600', lineHeight: 17, marginTop: 3 },
  submitButton: { height: 52, borderRadius: 15, backgroundColor: '#E10600', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 12 },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 30, marginBottom: 14 },
  sectionEyebrow: { color: '#E10600', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  sectionTitle: { color: '#fff', fontFamily: 'Montserrat_Bold', fontSize: 22, marginTop: 3 },
  countPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(225,6,0,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  countText: { color: '#E10600', fontWeight: '900' },
  loader: { height: 160, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 28, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.12)', backgroundColor: '#0a0a0c' },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(225,6,0,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: '#fff', fontFamily: 'Montserrat_Bold', fontSize: 18 },
  emptyText: { color: 'rgba(255,255,255,0.48)', textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 7 },
  howCard: { marginTop: 28, backgroundColor: '#0a0a0d', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  howEyebrow: { color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginBottom: 18 },
  stepRow: { flexDirection: 'row', minHeight: 72 },
  stepRail: { width: 34, alignItems: 'center' },
  stepNumber: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(225,6,0,0.13)', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#E10600', fontSize: 10, fontWeight: '900' },
  railLine: { flex: 1, width: 1, backgroundColor: 'rgba(225,6,0,0.22)', marginVertical: 4 },
  stepIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 },
  stepContent: { flex: 1, paddingTop: 1 },
  stepTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  stepText: { color: 'rgba(255,255,255,0.44)', fontSize: 12, lineHeight: 17, marginTop: 3 },
});
