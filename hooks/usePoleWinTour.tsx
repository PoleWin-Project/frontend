import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTourGuideController } from 'rn-tourguide';
import { TOUR_DONE_KEY, TOUR_SEEN_KEY, type TourKey } from '@/lib/onboarding';

interface PoleWinTourValue {
    /** `null` tant que l'état n'est pas chargé depuis AsyncStorage. */
    done: boolean | null;
    /** L'écran `key` doit-il auto-déclencher son sous-tour ? */
    shouldAutoStart: (key: TourKey) => boolean;
    /** Marque un sous-tour comme vu (persisté) pour ne plus le re-proposer. */
    markSeen: (key: TourKey) => void;
    /** Termine définitivement l'onboarding (clé 'polewin_tour_done'). */
    markTourDone: () => void;
    /** Réinitialise et relance le tutoriel depuis le début. */
    replayTour: () => void;
    /** Incrémenté à chaque replay pour ré-armer les effects des écrans. */
    replayNonce: number;
}

const PoleWinTourContext = createContext<PoleWinTourValue | undefined>(undefined);

/**
 * Provider d'onboarding. À placer *au-dessus* du TourGuideProvider pour que le
 * tooltip custom puisse appeler markTourDone()/replayTour().
 */
export function PoleWinTourProvider({ children }: { children: React.ReactNode }) {
    const [done, setDone] = useState<boolean | null>(null);
    const seenRef = useRef<Set<string>>(new Set());
    const [replayNonce, setReplayNonce] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const [doneRaw, seenRaw] = await AsyncStorage.multiGet([TOUR_DONE_KEY, TOUR_SEEN_KEY]);
                if (seenRaw[1]) {
                    const arr = JSON.parse(seenRaw[1]);
                    if (Array.isArray(arr)) arr.forEach((k) => seenRef.current.add(k));
                }
                setDone(doneRaw[1] === '1');
            } catch {
                setDone(false);
            }
        })();
    }, []);

    const markSeen = useCallback(async (key: TourKey) => {
        if (seenRef.current.has(key)) return;
        seenRef.current.add(key);
        try {
            await AsyncStorage.setItem(TOUR_SEEN_KEY, JSON.stringify([...seenRef.current]));
        } catch {
            // best-effort : si l'écriture échoue, on retentera au prochain stop
        }
    }, []);

    const markTourDone = useCallback(async () => {
        setDone(true);
        try {
            await AsyncStorage.setItem(TOUR_DONE_KEY, '1');
        } catch {
            // ignore
        }
    }, []);

    const replayTour = useCallback(async () => {
        seenRef.current.clear();
        setDone(false);
        setReplayNonce((n) => n + 1);
        try {
            await AsyncStorage.multiRemove([TOUR_DONE_KEY, TOUR_SEEN_KEY]);
        } catch {
            // ignore
        }
    }, []);

    const shouldAutoStart = useCallback(
        (key: TourKey) => done === false && !seenRef.current.has(key),
        [done],
    );

    return (
        <PoleWinTourContext.Provider
            value={{ done, shouldAutoStart, markSeen, markTourDone, replayTour, replayNonce }}
        >
            {children}
        </PoleWinTourContext.Provider>
    );
}

/** Accès au contrôleur global d'onboarding (replay, done, etc.). */
export function usePoleWinTour(): PoleWinTourValue {
    const ctx = useContext(PoleWinTourContext);
    if (!ctx) {
        throw new Error('usePoleWinTour doit être utilisé dans un <PoleWinTourProvider>');
    }
    return ctx;
}

/**
 * À appeler dans chaque écran porteur de zones. Branche l'auto-démarrage du
 * sous-tour de l'écran et marque le sous-tour comme « vu » à sa fermeture.
 *
 * @param tourKey identifiant du sous-tour (doit matcher les `tourKey` des zones)
 * @param delay   délai avant auto-start (laisse le temps au layout de se poser)
 */
interface ScreenTourOptions {
    /** Délai avant auto-start (laisse le temps au layout de se poser). */
    delay?: number;
    /**
     * ScrollView de l'écran : si fourni, on défile pour amener l'élément ciblé
     * à l'écran à chaque étape (rn-tourguide ne le fait pas tout seul).
     */
    scrollRef?: React.RefObject<any>;
    /** Offset de scroll courant (alimenté par onScroll de la ScrollView). */
    scrollYRef?: React.MutableRefObject<number>;
}

export function useScreenTour(tourKey: TourKey, options: ScreenTourOptions = {}) {
    const { delay = 800, scrollRef, scrollYRef } = options;
    const { canStart, start, eventEmitter } = useTourGuideController(tourKey);
    const { done, shouldAutoStart, markSeen, replayNonce } = usePoleWinTour();

    // Marque le sous-tour comme vu dès qu'il se ferme (fin, skip ou tap backdrop).
    useEffect(() => {
        if (!eventEmitter) return;
        const onStop = () => markSeen(tourKey);
        eventEmitter.on('stop', onStop);
        return () => eventEmitter.off('stop', onStop);
    }, [eventEmitter, tourKey, markSeen]);

    // Défile pour amener l'élément de l'étape courante dans le viewport.
    // On mesure en coordonnées écran (measure / measureInWindow) — compatible
    // New Architecture — plutôt que measureLayout (qui exige un ref natif).
    useEffect(() => {
        if (!eventEmitter || !scrollRef) return;
        const onStepChange = (step: any) => {
            const sv: any = scrollRef.current;
            const wrapper: any = step?.wrapper ?? step?.target?.wrapper;
            if (!sv?.scrollTo || typeof wrapper?.measure !== 'function') return;
            const nativeScroll: any = sv.getNativeScrollRef?.() ?? sv;
            if (typeof nativeScroll?.measureInWindow !== 'function') return;
            wrapper.measure((_x: number, _y: number, _w: number, _h: number, _pageX: number, pageY: number) => {
                if (typeof pageY !== 'number') return;
                nativeScroll.measureInWindow((_cx: number, cy: number) => {
                    const offset = scrollYRef?.current ?? 0;
                    const targetContentY = offset + (pageY - cy);
                    sv.scrollTo({ y: Math.max(0, targetContentY - 110), animated: true });
                });
            });
        };
        eventEmitter.on('stepChange', onStepChange);
        return () => eventEmitter.off('stepChange', onStepChange);
    }, [eventEmitter, scrollRef, scrollYRef]);

    // Auto-déclenchement au focus de l'écran (uniquement au 1er passage).
    useFocusEffect(
        useCallback(() => {
            let timer: ReturnType<typeof setTimeout> | undefined;
            if (canStart && shouldAutoStart(tourKey)) {
                timer = setTimeout(() => start(), delay);
            }
            return () => {
                if (timer) clearTimeout(timer);
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [canStart, tourKey, replayNonce, done]),
    );
}
