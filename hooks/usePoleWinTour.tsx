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
    /**
     * Numéros de zones (order) réellement situées DANS la ScrollView.
     * Les autres (ex. boutons de la barre d'onglets) ne sont pas défilées.
     */
    scrollZones?: number[];
}

export function useScreenTour(tourKey: TourKey, options: ScreenTourOptions = {}) {
    const { delay = 800, scrollRef, scrollYRef, scrollZones } = options;
    const { canStart, start, eventEmitter } = useTourGuideController(tourKey);
    const { done, shouldAutoStart, markSeen, replayNonce } = usePoleWinTour();

    // Étape courante (nom) — mis à jour SYNCHRONEMENT à chaque stepChange.
    // Sert de garde anti-rembobinage (cf. forceRemeasure) sans dépendre d'une
    // closure de getCurrentStep, qui peut être périmée au moment où le rAF se
    // déclenche (cause des cibles mal ciblées après un scroll).
    const currentNameRef = useRef<string | null>(null);
    // true tant que la 1re étape du tour n'a pas été traitée (remis à false au stop).
    const firstStepDoneRef = useRef(false);
    // Empêche la boucle infinie : marque le step qu'on vient de re-déclencher.
    const remeasureRef = useRef<string | null>(null);

    // Marque le sous-tour comme vu dès qu'il se ferme (fin, skip ou tap backdrop)
    // et réarme le repère « 1re étape » pour le prochain démarrage.
    useEffect(() => {
        if (!eventEmitter) return;
        const onStop = () => {
            markSeen(tourKey);
            firstStepDoneRef.current = false;
        };
        eventEmitter.on('stop', onStop);
        return () => eventEmitter.off('stop', onStop);
    }, [eventEmitter, tourKey, markSeen]);

    // À chaque étape : (1) amène la cible dans le viewport si besoin, puis
    // (2) force une re-mesure (re-start du même step) UNIQUEMENT quand c'est utile.
    // Cette re-mesure est nécessaire car :
    //   - rn-tourguide mesure la cible AVANT notre scroll → spotlight décalé ;
    //   - le SvgMask n'anime son opacité (assombrissement) que dans
    //     componentDidUpdate, quand la position/size CHANGE de référence. Au
    //     1er step d'un tour il vient de monter → aucune mise à jour → il reste
    //     à opacity 0. Re-déclencher animateMove crée une nouvelle position et
    //     l'assombrit.
    // On ne force donc la re-mesure que si (a) on a réellement scrollé, ou
    // (b) c'est la 1re étape du tour — sinon on évite un clignotement inutile
    // (le masque est déjà sombre et la cible déjà bien mesurée).
    useEffect(() => {
        if (!eventEmitter) return;
        const onStepChange = (step: any) => {
            const name: string | undefined = step?.name;
            // Re-fire déclenché par notre propre re-mesure : laisser rn-tourguide
            // recalculer et s'arrêter là.
            if (name != null && remeasureRef.current === name) {
                remeasureRef.current = null;
                currentNameRef.current = name;
                return;
            }
            currentNameRef.current = name ?? null;
            const isFirstOfTour = !firstStepDoneRef.current;
            firstStepDoneRef.current = true;

            const forceRemeasure = () =>
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => {
                        // Re-déclenche seulement si on est TOUJOURS sur cette étape
                        // (l'utilisateur n'a pas cliqué « Suivant » entre-temps).
                        if (name != null && currentNameRef.current === name) {
                            remeasureRef.current = name;
                            start(name as any);
                        }
                    }),
                );

            // Défilement uniquement pour les zones réellement dans la ScrollView.
            const inScroll = scrollRef && scrollZones && step?.order != null && scrollZones.includes(step.order);
            const sv: any = inScroll ? scrollRef!.current : null;
            const wrapper: any = step?.wrapper ?? step?.target?.wrapper;
            const nativeScroll: any = sv?.getNativeScrollRef?.() ?? sv;

            if (sv?.scrollTo && typeof wrapper?.measure === 'function' && typeof nativeScroll?.measureInWindow === 'function') {
                wrapper.measure((_x: number, _y: number, _w: number, targetH: number, _pageX: number, pageY: number) => {
                    if (typeof pageY !== 'number') { if (isFirstOfTour) forceRemeasure(); return; }
                    nativeScroll.measureInWindow((_cx: number, cy: number, _cw: number, ch: number) => {
                        const offset = scrollYRef?.current ?? 0;
                        // Centre la cible dans le viewport (marge haute mini 70px).
                        const desiredTop = Math.max(70, ((ch || 0) - (targetH || 0)) / 2);
                        const y = Math.max(0, offset + (pageY - cy) - desiredTop);
                        const willScroll = Math.abs(y - offset) >= 6;
                        if (willScroll) sv.scrollTo({ y, animated: false });
                        // Re-mesure si on a scrollé (cible déplacée) ou au 1er step.
                        if (willScroll || isFirstOfTour) forceRemeasure();
                    });
                });
            } else if (isFirstOfTour) {
                // Écran sans scroll (Pronos…) : forcer la re-mesure au 1er step pour
                // que le fond s'assombrisse (sinon le masque reste à opacity 0).
                forceRemeasure();
            }
        };
        eventEmitter.on('stepChange', onStepChange);
        return () => eventEmitter.off('stepChange', onStepChange);
    }, [eventEmitter, scrollRef, scrollYRef, scrollZones, start]);

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
