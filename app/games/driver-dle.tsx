import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Trophy,
  Search,
  X,
  Crown,
  ChevronUp,
  ChevronDown,
  Check,
  Zap,
  Timer,
  Flag,
  HelpCircle,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import {
  fetchRoster,
  submitGuess,
  type DriverDleRosterEntry,
  type DriverDleGuessFeedback,
  type DriverDleGuessResult,
  type NumericFeedback,
  type CategoricalFeedback,
} from '@/lib/api/driverDle';
import { fetchPlaysToday, fetchLeaderboard, type Leaderboard } from '@/lib/api/games';

const GAME_ID = 'driver-dle';
const MAX_ATTEMPTS = 6;
const { width: SW } = Dimensions.get('window');

// ─── Avatar helpers (cohérent avec le reaction-test) ────────────────────────
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
const RANK_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

const GREEN = 'rgba(21,128,61,0.9)';
const GREEN_BORDER = 'rgba(34,197,94,0.6)';
const RED = 'rgba(127,29,29,0.5)';
const RED_BORDER = 'rgba(239,68,68,0.4)';
const NEUTRAL = 'rgba(255,255,255,0.06)';
const NEUTRAL_BORDER = 'rgba(255,255,255,0.14)';

const COLUMNS: { key: keyof DriverDleGuessFeedback; label: string; numeric: boolean }[] = [
  { key: 'team', label: 'Écurie', numeric: false },
  { key: 'nationality', label: 'Nat.', numeric: false },
  { key: 'debutYear', label: 'Début', numeric: true },
  { key: 'wins', label: 'Vict.', numeric: true },
  { key: 'podiums', label: 'Pod.', numeric: true },
];

function getNextResetUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function DailyCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    function update() {
      const diff = getNextResetUTC().getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Reset...'); return; }
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 24, marginTop: 16, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
      <Icon as={Timer} size={14} color="rgba(255,255,255,0.5)" />
      <Text style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }}>
        Nouveau pilote dans :
      </Text>
      <Text style={{ color: '#E10600', fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {timeLeft}
      </Text>
    </View>
  );
}

// ─── Tuile d'attribut ────────────────────────────────────────────────────────

function AttrTile({ fb, numeric }: { fb: NumericFeedback | CategoricalFeedback; numeric: boolean }) {
  const exact = fb.status === 'exact';
  const wrongCat = !numeric && !exact;
  const bg = exact ? GREEN : wrongCat ? RED : NEUTRAL;
  const border = exact ? GREEN_BORDER : wrongCat ? RED_BORDER : NEUTRAL_BORDER;
  const arrow =
    numeric && !exact ? (fb.status === 'higher' ? ChevronUp : ChevronDown) : null;

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        aspectRatio: 1,
        maxHeight: 58,
        borderRadius: 10,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
      }}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ color: 'white', fontWeight: '900', fontSize: numeric ? 15 : 10, textAlign: 'center' }}
      >
        {String(fb.value)}
      </Text>
      {arrow && <Icon as={arrow} size={14} color="rgba(255,255,255,0.9)" />}
      {exact && !numeric && <Icon as={Check} size={12} color="rgba(255,255,255,0.9)" />}
    </View>
  );
}

// ─── Ligne de tentative ──────────────────────────────────────────────────────

function GuessRow({ feedback }: { feedback: DriverDleGuessFeedback }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {feedback.headshotUrl ? (
          <Image source={{ uri: feedback.headshotUrl }} style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        ) : (
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        )}
        <Text numberOfLines={1} style={{ flex: 1, color: 'white', fontWeight: '800', fontSize: 13 }}>
          {feedback.fullName}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {COLUMNS.map((col) => (
          <AttrTile key={col.key} fb={feedback[col.key] as any} numeric={col.numeric} />
        ))}
      </View>
    </View>
  );
}

// ─── Écran ───────────────────────────────────────────────────────────────────

export default function DriverDleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accessToken, refreshProfile } = useAuth();

  const [roster, setRoster] = useState<DriverDleRosterEntry[]>([]);
  const [query, setQuery] = useState('');
  const [guesses, setGuesses] = useState<DriverDleGuessFeedback[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [found, setFound] = useState(false);
  const [solution, setSolution] = useState<DriverDleRosterEntry | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);

  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Classement
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('@polewin/driverdle_rules_seen').then((seen) => {
      if (!seen) {
        setRulesVisible(true);
        AsyncStorage.setItem('@polewin/driverdle_rules_seen', '1').catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let mounted = true;
    (async () => {
      const [r, plays] = await Promise.all([
        fetchRoster(accessToken),
        fetchPlaysToday(accessToken, GAME_ID),
      ]);
      if (!mounted) return;
      setRoster(r);
      if (plays.limit !== null && plays.played >= plays.limit) setAlreadyPlayed(true);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [accessToken]);

  useEffect(() => {
    if (resultVisible) {
      resultAnim.setValue(0);
      Animated.spring(resultAnim, { toValue: 1, damping: 18, stiffness: 180, useNativeDriver: true }).start();
    }
  }, [resultVisible]);

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.driverId)), [guesses]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return roster
      .filter((d) => !guessedIds.has(d.driverId) && d.fullName.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, roster, guessedIds]);

  const attemptsUsed = guesses.length;
  const canPlay = !gameOver && !alreadyPlayed && attemptsUsed < MAX_ATTEMPTS;

  async function handleGuess(driver: DriverDleRosterEntry) {
    if (!accessToken || submitting || !canPlay) return;
    setSubmitting(true);
    setError(null);
    setQuery('');
    const res = await submitGuess(accessToken, driver.driverId);
    setSubmitting(false);

    if ('error' in res && res.error) {
      setError(res.error);
      // Quota atteint côté serveur → verrouille l'écran.
      if (/déjà joué|demain/i.test(res.error)) setAlreadyPlayed(true);
      return;
    }

    const result = res as DriverDleGuessResult;
    setGuesses((prev) => [...prev, result.feedback]);

    if (result.gameOver) {
      setGameOver(true);
      setFound(result.found);
      setSolution(result.solution ?? null);
      setPointsEarned(result.pointsEarned ?? null);
      setResultVisible(true);
      refreshProfile().catch(() => {});
    }
  }

  function openLeaderboard() {
    setLeaderboardVisible(true);
    if (!accessToken) return;
    setLeaderboardLoading(true);
    fetchLeaderboard(accessToken, GAME_ID)
      .then(setLeaderboard)
      .finally(() => setLeaderboardLoading(false));
  }

  // ─── Header ────────────────────────────────────────────────────────────────
  const Header = (
    <View style={{ paddingTop: insets.top }} className="flex-row justify-between items-center px-6 py-4">
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="justify-center items-center bg-white/10 border border-white/20 rounded-full w-10 h-10"
        >
          <Icon as={ChevronLeft} size={20} className="text-white" />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 2 }} className="items-center">
        <Text className="font-black text-[10px] text-primary uppercase tracking-[3px]">Driver Guess</Text>
        <Text className="font-black text-white text-xs italic uppercase">Le Garage</Text>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <TouchableOpacity
          onPress={() => setRulesVisible(true)}
          className="justify-center items-center bg-white/10 border border-white/20 rounded-full w-10 h-10"
        >
          <Icon as={HelpCircle} size={18} className="text-white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openLeaderboard}
          className="justify-center items-center bg-white/10 border border-white/20 rounded-full w-10 h-10"
        >
          <Icon as={Trophy} size={18} className="text-white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505' }}>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        {Header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#E10600" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#050505' }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      {Header}

      {alreadyPlayed && !resultVisible ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 32 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon as={Timer} size={40} color="rgba(255,255,255,0.3)" />
          </View>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Text className="font-black text-white text-3xl italic uppercase">Reviens demain</Text>
            <Text className="text-white/40 text-sm text-center" style={{ lineHeight: 22 }}>
              Tu as déjà joué aujourd'hui.{'\n'}Un nouveau pilote t'attend demain !
            </Text>
          </View>
          <TouchableOpacity
            onPress={openLeaderboard}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,215,0,0.10)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.30)' }}
          >
            <Icon as={Trophy} size={16} color="#FFD700" />
            <Text className="font-black text-sm uppercase" style={{ color: '#FFD700', letterSpacing: 1 }}>Voir le classement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Search + suggestions */}
          {canPlay && (
            <View style={{ paddingHorizontal: 20, zIndex: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 16, paddingHorizontal: 14 }}>
                <Icon as={Search} size={18} color="rgba(255,255,255,0.5)" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Devine le pilote du jour…"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  editable={!submitting}
                  autoCorrect={false}
                  style={{ flex: 1, color: 'white', fontSize: 15, fontWeight: '600', paddingVertical: 14 }}
                />
                {submitting && <ActivityIndicator color="#E10600" size="small" />}
              </View>

              {suggestions.length > 0 && (
                <View style={{ marginTop: 6, backgroundColor: '#111114', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 16, overflow: 'hidden' }}>
                  {suggestions.map((d, i) => (
                    <TouchableOpacity
                      key={d.driverId}
                      onPress={() => handleGuess(d)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,0.06)' }}
                    >
                      {d.headshotUrl ? (
                        <Image source={{ uri: d.headshotUrl }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                      ) : (
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>{d.fullName}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' }}>{d.teamName} · #{d.driverNumber}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {error && (
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600', marginTop: 8, marginLeft: 4 }}>{error}</Text>
              )}
            </View>
          )}

          {/* Compteur d'essais */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            {[...Array(MAX_ATTEMPTS)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: 9, height: 9, borderRadius: 5,
                  backgroundColor: i < attemptsUsed ? '#E10600' : 'rgba(255,255,255,0.18)',
                }}
              />
            ))}
            <Text style={{ marginLeft: 6, color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' }}>
              {attemptsUsed}/{MAX_ATTEMPTS} essais
            </Text>
          </View>

          {/* En-tête colonnes */}
          {guesses.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 20, marginTop: 14 }}>
              {COLUMNS.map((col) => (
                <View key={col.key} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>{col.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Grille des tentatives */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
            {guesses.length === 0 ? (
              <View style={{ alignItems: 'center', gap: 12, paddingTop: 48, paddingHorizontal: 24 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(225,6,0,0.12)', borderWidth: 1, borderColor: 'rgba(225,6,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon as={Flag} size={34} color="#E10600" />
                </View>
                <Text className="font-black text-white text-xl italic uppercase" style={{ marginTop: 4 }}>Qui est le pilote du jour ?</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                  Tape un nom pour lancer ta première tentative.{'\n'}Vert = exact · flèche = plus haut/bas.
                </Text>
              </View>
            ) : (
              guesses.map((g, i) => <GuessRow key={`${g.driverId}-${i}`} feedback={g} />)
            )}
          </ScrollView>
        </View>
      )}

      {/* Popup résultat */}
      <Modal visible={resultVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setResultVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Animated.View style={{ width: '100%', borderRadius: 28, backgroundColor: '#0c0c0f', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', opacity: resultAnim, transform: [{ translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }] }}>
            <View style={{ backgroundColor: found ? 'rgba(21,128,61,0.12)' : 'rgba(225,6,0,0.10)', borderBottomWidth: 1, borderBottomColor: found ? 'rgba(34,197,94,0.25)' : 'rgba(225,6,0,0.2)', paddingHorizontal: 24, paddingVertical: 22, alignItems: 'center', gap: 10 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: found ? 'rgba(34,197,94,0.18)' : 'rgba(225,6,0,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon as={found ? Trophy : Flag} size={30} color={found ? '#22C55E' : '#E10600'} />
              </View>
              <Text className="font-black text-white text-2xl italic uppercase">
                {found ? 'Bravo !' : 'Perdu !'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>
                {found
                  ? `Trouvé en ${attemptsUsed} essai${attemptsUsed > 1 ? 's' : ''}.`
                  : 'Tu n\'as pas trouvé le pilote du jour.'}
              </Text>
            </View>

            {/* Solution */}
            {solution && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 24, marginTop: 20, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                {solution.headshotUrl ? (
                  <Image source={{ uri: solution.headshotUrl }} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                ) : (
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>{solution.fullName}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' }}>{solution.teamName} · #{solution.driverNumber}</Text>
                </View>
              </View>
            )}

            {/* Points */}
            {found && pointsEarned != null && (
              <View style={{ marginHorizontal: 24, marginTop: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', paddingVertical: 18, alignItems: 'center', gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon as={Trophy} size={16} color="#E10600" />
                  <Text className="font-black text-[10px] text-white/60 uppercase" style={{ letterSpacing: 3 }}>Points gagnés</Text>
                </View>
                <Text className="font-black text-white text-4xl">+{pointsEarned}</Text>
                <Text className="font-bold text-[10px] text-green-400 uppercase" style={{ letterSpacing: 1 }}>Crédités sur ton compte</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12, padding: 24 }}>
              <TouchableOpacity
                // On ferme d'abord le popup de résultat : deux <Modal> ne peuvent
                // pas être présentés en même temps (le classement ne s'ouvrirait pas).
                onPress={() => { setResultVisible(false); setTimeout(openLeaderboard, 320); }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', paddingVertical: 14, borderRadius: 16 }}
              >
                <Icon as={Trophy} size={16} color="#FFD700" />
                <Text className="font-black text-sm uppercase" style={{ color: '#FFD700' }}>Classement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setResultVisible(false); router.back(); }}
                style={{ flex: 1, backgroundColor: '#E10600', paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="font-black text-white text-sm uppercase">Quitter</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Modal Règles */}
      <Modal visible={rulesVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setRulesVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '85%', backgroundColor: '#0c0c0f', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', paddingBottom: insets.bottom + 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 14 }}>
                <Icon as={HelpCircle} size={22} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, fontStyle: 'italic', textTransform: 'uppercase' }}>Comment jouer ?</Text>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 }}>Les règles de DriverDLE</Text>
              </View>
              <TouchableOpacity
                onPress={() => setRulesVisible(false)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon as={X} size={18} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 22 }}>
                Tu as <Text style={{ color: 'white', fontWeight: 'bold' }}>6 essais</Text> pour deviner le pilote de F1 du jour.
              </Text>
              
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 22 }}>
                À chaque essai, la grille te donne des indices sur les caractéristiques du pilote comparées à celles du pilote mystère.
                <Text style={{ color: '#E10600', fontWeight: 'bold' }}> Attention : </Text>
                les statistiques (victoires, podiums) correspondent à la <Text style={{ color: 'white', fontWeight: 'bold' }}>saison en cours</Text>, et non à l'ensemble de la carrière !
              </Text>
              
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: GREEN, borderWidth: 1, borderColor: GREEN_BORDER, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon as={Check} size={12} color="white" />
                  </View>
                  <Text style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Vert : l'attribut est correct.</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: RED, borderWidth: 1, borderColor: RED_BORDER }} />
                  <Text style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Rouge : l'attribut est incorrect.</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: RED, borderWidth: 1, borderColor: RED_BORDER, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon as={ChevronUp} size={14} color="white" />
                  </View>
                  <Text style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Flèche haut : la valeur du pilote mystère est <Text style={{ fontWeight: 'bold', color: 'white' }}>plus grande</Text>.</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: RED, borderWidth: 1, borderColor: RED_BORDER, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon as={ChevronDown} size={14} color="white" />
                  </View>
                  <Text style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Flèche bas : la valeur du pilote mystère est <Text style={{ fontWeight: 'bold', color: 'white' }}>plus petite</Text>.</Text>
                </View>
              </View>

              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 22, marginTop: 8 }}>
                Le pilote du jour change tous les soirs à minuit (UTC). Bonne chance !
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Classement */}
      <Modal visible={leaderboardVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setLeaderboardVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '85%', backgroundColor: '#0c0c0f', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', paddingBottom: insets.bottom + 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
              <View style={{ backgroundColor: 'rgba(255,215,0,0.15)', padding: 10, borderRadius: 14 }}>
                <Icon as={Trophy} size={22} color="#FFD700" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, fontStyle: 'italic', textTransform: 'uppercase' }}>Classement</Text>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 }}>Moins d'essais = meilleur rang</Text>
              </View>
              <TouchableOpacity
                onPress={() => setLeaderboardVisible(false)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon as={X} size={18} color="white" />
              </TouchableOpacity>
            </View>

            <DailyCountdown />

            {leaderboardLoading ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator color="#E10600" />
              </View>
            ) : !leaderboard || leaderboard.entries.length === 0 ? (
              <View style={{ paddingVertical: 60, paddingHorizontal: 32, alignItems: 'center', gap: 12 }}>
                <Icon as={Flag} size={40} color="rgba(255,255,255,0.2)" />
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
                  Aucun score enregistré pour l'instant.{'\n'}Sois le premier à trouver le pilote !
                </Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
                {leaderboard.entries.map((e) => {
                  const name = e.displayName || `Pilote #${e.userId}`;
                  const grad = avatarGradient(name);
                  const rankColor = RANK_COLORS[e.rank];
                  return (
                    <View
                      key={e.userId}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 14,
                        marginHorizontal: 16, marginVertical: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
                        backgroundColor: e.isMe ? 'rgba(225,6,0,0.12)' : 'rgba(255,255,255,0.04)',
                        borderWidth: 1, borderColor: e.isMe ? 'rgba(225,6,0,0.4)' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <View style={{ width: 30, alignItems: 'center' }}>
                        {e.rank <= 3 ? (
                          <Icon as={Crown} size={20} color={rankColor} />
                        ) : (
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 15 }}>{e.rank}</Text>
                        )}
                      </View>
                      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, fontStyle: 'italic' }}>{name[0]?.toUpperCase()}</Text>
                      </LinearGradient>
                      <Text numberOfLines={1} style={{ flex: 1, color: 'white', fontWeight: '800', fontSize: 14 }}>
                        {name}{e.isMe ? ' (toi)' : ''}
                      </Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: rankColor || '#fff', fontWeight: '900', fontSize: 16, fontStyle: 'italic' }}>{e.bestMs}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>essais</Text>
                      </View>
                    </View>
                  );
                })}

                {leaderboard.me && !leaderboard.entries.some((e) => e.isMe) && (
                  <>
                    <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.25)', fontWeight: '900', fontSize: 16 }}>···</Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 14,
                        marginHorizontal: 16, marginVertical: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
                        backgroundColor: 'rgba(225,6,0,0.12)', borderWidth: 1, borderColor: 'rgba(225,6,0,0.4)',
                      }}
                    >
                      <View style={{ width: 30, alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 15 }}>{leaderboard.me.rank}</Text>
                      </View>
                      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(225,6,0,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon as={Zap} size={18} color="#E10600" />
                      </View>
                      <Text style={{ flex: 1, color: 'white', fontWeight: '800', fontSize: 14 }}>Ton meilleur score</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, fontStyle: 'italic' }}>{leaderboard.me.bestMs}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>essais</Text>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
