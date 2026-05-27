import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  PanResponder,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle as SvgCircle, Defs, Pattern as SvgPattern, Rect } from 'react-native-svg';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Timer, Trophy, AlertTriangle, RotateCcw, Zap } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { rewardUser, fetchPlaysToday, type PlaysToday } from '@/lib/api/games';

const { width: SW, height: SH } = Dimensions.get('window');
const RIPPLE_MAX = 300;
const NUM_RIPPLES = 4;
const RIPPLE_DUR = 1600;

type GameState = 'idle' | 'holding' | 'flash' | 'false-start' | 'result';

function getPoints(ms: number): number {
  const keyframes: [number, number][] = [
    [0,   50],
    [50,  35],
    [100, 20],
    [200, 10],
    [300,  5],
    [500,  2],
  ];
  if (ms <= 0)   return 50;
  if (ms >= 500) return 2;
  for (let i = 0; i < keyframes.length - 1; i++) {
    const [t0, v0] = keyframes[i];
    const [t1, v1] = keyframes[i + 1];
    if (ms >= t0 && ms < t1) {
      const t = (ms - t0) / (t1 - t0);
      return Math.round(v0 + t * (v1 - v0));
    }
  }
  return 2;
}

function getRating(ms: number): { label: string; color: string } {
  if (ms < 150) return { label: 'Pilote F1',       color: '#FFD700' };
  if (ms < 250) return { label: 'Pole Position',   color: '#00D1FF' };
  if (ms < 350) return { label: 'Dans les points', color: '#4ADE80' };
  if (ms < 500) return { label: 'Milieu de grille',color: '#FACC15' };
  if (ms < 700) return { label: 'Lanterne rouge',  color: '#FB923C' };
  return         { label: 'Drapeau rouge',          color: '#EF4444' };
}

const RULES = [
  "Appuie et maintiens le doigt n'importe où sur l'écran.",
  "L'écran deviendra vert à un moment aléatoire.",
  "Dès que c'est vert — relâche le doigt le plus vite possible !",
  "Relâcher avant le vert = faux départ !",
];

const SCORE_ROWS = [
  { range: '< 50 ms',    pts: '50 pts', color: '#FFD700' },
  { range: '50–100 ms',  pts: '35 pts', color: '#00D1FF' },
  { range: '100–200 ms', pts: '20 pts', color: '#4ADE80' },
  { range: '200–300 ms', pts: '10 pts', color: '#FACC15' },
  { range: '300–500 ms', pts: '5 pts',  color: '#FB923C' },
  { range: '> 500 ms',   pts: '2 pts',  color: '#EF4444' },
];

export default function ReactionTestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accessToken, refreshProfile } = useAuth();

  // ─── React state (for rendering) ────────────────────────────────────────
  const [rulesVisible, setRulesVisible] = useState(false);
  const [plays, setPlays] = useState<PlaysToday | null>(null); // null = chargement
  const [gameState, setGameState] = useState<GameState>('idle');
  const [touchPos, setTouchPos] = useState({ x: SW / 2, y: SH / 2 });
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [rewarded, setRewarded] = useState(false);

  // ─── Stable refs (safe to read from PanResponder) ────────────────────────
  const gameStateRef = useRef<GameState>('idle');
  const flashStartRef = useRef<number | null>(null);
  const gameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rulesVisibleRef = useRef(false);
  const gameEnabledRef = useRef(false); // true uniquement après "J'ai compris"
  const isLimitedRef   = useRef(false); // miroir stable de isLimited pour PanResponder
  const accessTokenRef = useRef(accessToken);
  const refreshProfileRef = useRef(refreshProfile);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);
  useEffect(() => { refreshProfileRef.current = refreshProfile; }, [refreshProfile]);

  // ─── Animations ──────────────────────────────────────────────────────────
  const bgAnim = useRef(new Animated.Value(0)).current; // 0=dark 1=green 2=red
  const modalCardAnim = useRef(new Animated.Value(0)).current;

  const rippleAnims = useRef(
    Array.from({ length: NUM_RIPPLES }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;
  const rippleLoops = useRef<(Animated.CompositeAnimation | null)[]>(
    Array(NUM_RIPPLES).fill(null)
  );

  const centerScale = useRef(new Animated.Value(1)).current;
  const centerPulseAnim = useRef<ReturnType<typeof Animated.loop> | null>(null);

  // Blob corner radii (non-native — can't share Animated.View with native scale)
  const BLOB_R = 26; // half of 52px
  const blobAnims = useRef([
    new Animated.Value(BLOB_R),
    new Animated.Value(BLOB_R),
    new Animated.Value(BLOB_R),
    new Animated.Value(BLOB_R),
  ]).current;
  const blobRunning = useRef(false);

  // ─── Helpers (use only stable refs → safe from PanResponder) ────────────

  function stopRipples() {
    rippleLoops.current.forEach((l, i) => {
      l?.stop();
      rippleLoops.current[i] = null;
    });
    rippleAnims.forEach(a => { a.scale.setValue(0); a.opacity.setValue(0); });
  }

  function makeWaveLoop(anim: typeof rippleAnims[0]) {
    return Animated.loop(
      Animated.parallel([
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: RIPPLE_DUR,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: RIPPLE_DUR,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
  }

  function startRipples() {
    stopRipples();
    // Pre-offset each wave so all 4 are visible immediately from frame 1.
    // Wave i starts at progress (i / NUM_RIPPLES) into its cycle.
    rippleAnims.forEach((anim, i) => {
      const progress = i / NUM_RIPPLES; // 0, 0.25, 0.5, 0.75
      const remainDur = Math.round(RIPPLE_DUR * (1 - progress));

      anim.scale.setValue(progress);
      anim.opacity.setValue(0.8 * (1 - progress));

      // Complete the partial cycle first, then hand off to the full loop
      const partial = Animated.parallel([
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: remainDur,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: remainDur,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

      rippleLoops.current[i] = partial;

      partial.start(({ finished }) => {
        if (!finished) return; // stopped externally
        anim.scale.setValue(0);
        anim.opacity.setValue(0.8);
        const loop = makeWaveLoop(anim);
        rippleLoops.current[i] = loop;
        loop.start();
      });
    });
  }

  function runBlobStep() {
    if (!blobRunning.current) return;
    Animated.parallel(
      blobAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 8 + Math.random() * 34, // 8–42 px range
          duration: 280 + Math.random() * 380,
          useNativeDriver: false,
        })
      )
    ).start(({ finished }) => { if (finished) runBlobStep(); });
  }

  function startPulse() {
    centerScale.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(centerScale, { toValue: 1.25, duration: 450, useNativeDriver: true }),
        Animated.timing(centerScale, { toValue: 1, duration: 450, useNativeDriver: true }),
      ])
    );
    centerPulseAnim.current = loop;
    loop.start();
    // Start blob deformation (separate non-native animation)
    blobRunning.current = true;
    blobAnims.forEach(a => a.setValue(BLOB_R));
    runBlobStep();
  }

  function stopPulse() {
    centerPulseAnim.current?.stop();
    centerPulseAnim.current = null;
    centerScale.setValue(1);
    blobRunning.current = false;
    blobAnims.forEach(a => { a.stopAnimation(); a.setValue(BLOB_R); });
  }

  function animBg(val: number, dur = 100) {
    Animated.timing(bgAnim, { toValue: val, duration: dur, useNativeDriver: false }).start();
  }

  function clearTimer() {
    if (gameTimerRef.current) { clearTimeout(gameTimerRef.current); gameTimerRef.current = null; }
  }

  function setStateSafe(s: GameState) {
    gameStateRef.current = s;
    setGameState(s);
  }

  function resetGame() {
    clearTimer();
    stopRipples();
    stopPulse();
    flashStartRef.current = null;
    setReactionTime(null);
    setEarnedPoints(null);
    setRewarded(false);
    setStateSafe('idle');
    animBg(0, 300);
  }

  // ─── PanResponder ────────────────────────────────────────────────────────
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        gameEnabledRef.current && gameStateRef.current === 'idle' && !isLimitedRef.current,

      onPanResponderGrant: (e) => {
        if (!gameEnabledRef.current || gameStateRef.current !== 'idle' || isLimitedRef.current) return;
        const { pageX, pageY } = e.nativeEvent;
        setTouchPos({ x: pageX, y: pageY });
        setStateSafe('holding');
        animBg(0, 50);
        startRipples();
        startPulse();
        clearTimer();
        const delay = 1500 + Math.random() * 3500;
        gameTimerRef.current = setTimeout(() => {
          if (gameStateRef.current !== 'holding') return;
          flashStartRef.current = Date.now();
          setStateSafe('flash');
          animBg(1, 70);
        }, delay);
      },

      onPanResponderMove: (e) => {
        const s = gameStateRef.current;
        if (s === 'holding' || s === 'flash') {
          setTouchPos({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
        }
      },

      onPanResponderRelease: async () => {
        if (!gameEnabledRef.current) return;
        const s = gameStateRef.current;

        if (s === 'holding') {
          clearTimer();
          stopRipples();
          stopPulse();
          setStateSafe('false-start');
          animBg(2, 80);
          return;
        }

        if (s === 'flash' && flashStartRef.current !== null) {
          const elapsed = Date.now() - flashStartRef.current;
          const pts = getPoints(elapsed);
          stopRipples();
          stopPulse();
          setStateSafe('result');
          setReactionTime(elapsed);
          setEarnedPoints(pts);
          animBg(0, 300);
          const token = accessTokenRef.current;
          if (token) {
            try {
              await rewardUser(token, pts, 'reaction');
              await refreshProfileRef.current();
              setRewarded(true);
            } catch { /* silent */ }
            // Toujours re-fetcher le vrai compteur depuis le backend
            fetchPlaysToday(token, 'reaction').then(setPlays);
          }
        }
      },

      onPanResponderTerminate: () => {
        const s = gameStateRef.current;
        if (s === 'holding' || s === 'flash') {
          clearTimer(); stopRipples(); stopPulse();
          setStateSafe('idle'); animBg(0, 200);
        }
      },
    })
  ).current;

  // ─── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { rulesVisibleRef.current = true; setRulesVisible(true); }, 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (rulesVisible) {
      modalCardAnim.setValue(0);
      Animated.spring(modalCardAnim, {
        toValue: 1,
        damping: 18,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [rulesVisible]);

  useEffect(() => {
    if (!accessToken) return;
    fetchPlaysToday(accessToken, 'reaction').then(setPlays);
  }, [accessToken]);

  useEffect(() => {
    const left = plays
      ? plays.limit === null ? null : Math.max(0, plays.limit - plays.played)
      : null;
    isLimitedRef.current = left !== null && left <= 0;
  }, [plays]);

  useEffect(() => {
    return () => { clearTimer(); stopRipples(); stopPulse(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const playsLeft = plays
    ? plays.limit === null ? null : Math.max(0, plays.limit - plays.played)
    : null; // null = illimité (admin) ou chargement
  const isLimited = playsLeft !== null && playsLeft <= 0;
  const isDown = gameState === 'holding' || gameState === 'flash';
  const rating = reactionTime !== null ? getRating(reactionTime) : null;
  const rippleColor = gameState === 'flash' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)';
  const centerColor = gameState === 'flash' ? '#FFFFFF' : '#E10600';

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['#050505', '#15803D', '#7F1D1D'],
  });

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Animated.View style={{ flex: 1, backgroundColor: bgColor }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />

      {/* Dotted background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        <Svg width={SW} height={SH}>
          <Defs>
            <SvgPattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <SvgCircle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.10)" />
            </SvgPattern>
          </Defs>
          <Rect width={SW} height={SH} fill="url(#dots)" />
        </Svg>
      </View>

      {/* Ripple waves — follow the finger */}
      {isDown && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: touchPos.x - RIPPLE_MAX / 2,
            top: touchPos.y - RIPPLE_MAX / 2,
            width: RIPPLE_MAX,
            height: RIPPLE_MAX,
          }}
        >
          {rippleAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: RIPPLE_MAX,
                height: RIPPLE_MAX,
                borderRadius: RIPPLE_MAX / 2,
                borderWidth: 1.5,
                borderColor: rippleColor,
                transform: [{ scale: anim.scale }],
                opacity: anim.opacity,
              }}
            />
          ))}
          {/* Center dot — scale (native) wraps blob shape (non-native) */}
          <Animated.View
            style={{
              position: 'absolute',
              left: RIPPLE_MAX / 2 - 26,
              top: RIPPLE_MAX / 2 - 26,
              width: 52,
              height: 52,
              transform: [{ scale: centerScale }],
            }}
          >
            <Animated.View
              style={{
                width: 52,
                height: 52,
                backgroundColor: centerColor,
                borderTopLeftRadius: blobAnims[0],
                borderTopRightRadius: blobAnims[1],
                borderBottomRightRadius: blobAnims[2],
                borderBottomLeftRadius: blobAnims[3],
                shadowColor: centerColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 16,
                elevation: 12,
              }}
            />
          </Animated.View>
        </View>
      )}

      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="flex-row justify-between items-center px-6 py-4">
        <TouchableOpacity
          onPress={() => { clearTimer(); stopRipples(); stopPulse(); router.back(); }}
          className="justify-center items-center bg-white/10 border border-white/20 rounded-full w-10 h-10"
        >
          <Icon as={ChevronLeft} size={20} className="text-white" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="font-black text-[10px] text-primary uppercase tracking-[3px]">Reaction Test</Text>
          <Text className="font-black text-white text-xs italic uppercase">Le Garage</Text>
        </View>
        <View className="w-10 h-10" />
      </View>

      {/* Game area — PanResponder lives here */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }} {...pan.panHandlers}>

        {gameState === 'idle' && !isLimited && (
          <View style={{ alignItems: 'center', gap: 20 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(225,6,0,0.12)', borderWidth: 1, borderColor: 'rgba(225,6,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon as={Zap} size={40} color="#E10600" />
            </View>
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Text className="font-black text-white text-4xl italic uppercase">Prêt ?</Text>
              <Text className="text-white/50 text-sm text-center" style={{ lineHeight: 22 }}>
                Appuie et maintiens le doigt{'\n'}n'importe où sur l'écran.
              </Text>
            </View>
            {/* Compteur de parties restantes */}
            {playsLeft !== null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 }}>
                {[...Array(plays!.limit!)].map((_, i) => (
                  <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < playsLeft ? '#E10600' : 'rgba(255,255,255,0.2)' }} />
                ))}
                <Text className="font-bold text-white/50 text-xs" style={{ marginLeft: 4 }}>
                  {playsLeft} partie{playsLeft > 1 ? 's' : ''} restante{playsLeft > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {gameState === 'idle' && isLimited && (
          <View style={{ alignItems: 'center', gap: 24 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon as={Timer} size={40} color="rgba(255,255,255,0.3)" />
            </View>
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Text className="font-black text-white text-3xl italic uppercase">Reviens demain</Text>
              <Text className="text-white/40 text-sm text-center" style={{ lineHeight: 22 }}>
                Tu as utilisé tes 3 parties{'\n'}d'aujourd'hui. À demain !
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              ))}
            </View>
          </View>
        )}

        {gameState === 'holding' && (
          <View style={{ alignItems: 'center', gap: 12 }} pointerEvents="none">
            <Text className="font-black text-white text-4xl italic uppercase">Maintiens...</Text>
            <Text className="font-bold text-white/40 text-xs uppercase" style={{ letterSpacing: 3 }}>Attends le vert</Text>
          </View>
        )}

        {gameState === 'flash' && (
          <View style={{ alignItems: 'center', gap: 12 }} pointerEvents="none">
            <Text className="font-black text-white text-6xl italic uppercase">RELÂCHE !</Text>
            <Text className="font-bold text-white/80 text-sm uppercase" style={{ letterSpacing: 5 }}>Maintenant !</Text>
          </View>
        )}

        {gameState === 'false-start' && (
          <View style={{ alignItems: 'center', gap: 24 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon as={AlertTriangle} size={40} color="#EF4444" />
            </View>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text className="font-black text-white text-3xl italic uppercase">Faux départ !</Text>
              <Text className="text-white/50 text-sm text-center" style={{ lineHeight: 22 }}>
                Tu as relâché avant le vert.{'\n'}Attends le flash !
              </Text>
            </View>
            <TouchableOpacity
              onPress={resetGame}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 16 }}
            >
              <Icon as={RotateCcw} size={16} color="white" />
              <Text className="font-black text-white text-sm uppercase" style={{ letterSpacing: 1 }}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'result' && reactionTime !== null && rating !== null && (
          <View style={{ alignItems: 'center', gap: 20, width: '100%' }}>
            {/* Reaction time */}
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text className="font-black text-7xl italic" style={{ color: rating.color, lineHeight: 80 }}>
                {reactionTime}
              </Text>
              <Text className="font-bold text-white/50 text-sm uppercase" style={{ letterSpacing: 6 }}>
                millisecondes
              </Text>
            </View>

            {/* Rating badge */}
            <View style={{ paddingHorizontal: 22, paddingVertical: 8, borderRadius: 999, backgroundColor: `${rating.color}25`, borderWidth: 1, borderColor: `${rating.color}60` }}>
              <Text className="font-black text-sm uppercase" style={{ color: rating.color, letterSpacing: 3 }}>{rating.label}</Text>
            </View>

            {/* Points card */}
            <View style={{ width: '100%', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', padding: 24, alignItems: 'center', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Icon as={Trophy} size={18} color="#E10600" />
                <Text className="font-black text-[10px] text-white/60 uppercase" style={{ letterSpacing: 3 }}>Points gagnés</Text>
              </View>
              <Text className="font-black text-white text-5xl">+{earnedPoints}</Text>
              {rewarded && (
                <Text className="font-bold text-[10px] text-green-400 uppercase" style={{ letterSpacing: 1 }}>Crédités sur ton compte</Text>
              )}
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                onPress={resetGame}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, borderRadius: 16 }}
              >
                <Icon as={RotateCcw} size={16} color="white" />
                <Text className="font-black text-white text-sm uppercase">Rejouer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ flex: 1, backgroundColor: '#E10600', paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="font-black text-white text-sm uppercase">Quitter</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>

      {/* Bottom hint */}
      {isDown && (
        <View style={{ paddingBottom: insets.bottom + 28, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 3 }}>
            {gameState === 'flash' ? 'Relâche le doigt !' : 'Ne relâche pas...'}
          </Text>
        </View>
      )}

      {/* Rules modal */}
      <Modal visible={rulesVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Animated.View style={{ width: '100%', borderRadius: 28, backgroundColor: '#0c0c0f', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', opacity: modalCardAnim, transform: [{ translateY: modalCardAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }] }}>

            <View style={{ backgroundColor: 'rgba(225,6,0,0.08)', borderBottomWidth: 1, borderBottomColor: 'rgba(225,6,0,0.18)', paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ backgroundColor: 'rgba(225,6,0,0.18)', padding: 10, borderRadius: 14 }}>
                <Icon as={Timer} size={22} color="#E10600" />
              </View>
              <View>
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, fontStyle: 'italic', textTransform: 'uppercase' }}>Reaction Test</Text>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 }}>Règles du jeu</Text>
              </View>
            </View>

            <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, gap: 14 }}>
              {RULES.map((rule, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(225,6,0,0.18)', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>
                    <Text style={{ color: '#E10600', fontWeight: '900', fontSize: 11 }}>{i + 1}</Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 20, flex: 1 }}>{rule}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginHorizontal: 24, marginBottom: 20, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 }}>Barème</Text>
              </View>
              {SCORE_ROWS.map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: i < SCORE_ROWS.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{row.range}</Text>
                  <Text style={{ color: row.color, fontWeight: '900', fontSize: 12 }}>{row.pts}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => { rulesVisibleRef.current = false; gameEnabledRef.current = true; setRulesVisible(false); }}
              style={{ marginHorizontal: 24, marginBottom: 24, backgroundColor: '#E10600', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 }}>J'ai compris</Text>
            </TouchableOpacity>

          </Animated.View>
        </View>
      </Modal>
    </Animated.View>
  );
}
