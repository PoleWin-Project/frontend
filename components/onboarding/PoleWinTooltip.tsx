import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { TooltipProps } from 'rn-tourguide';
import { parseTourStep } from '@/lib/onboarding';
import { usePoleWinTour } from '@/hooks/usePoleWinTour';

const AVATAR_TUTO = require('@/assets/avatars/Avatar-tuto.png');

// Polices : le projet charge Inter (corps) & Montserrat (display).
// On s'aligne dessus — Bebas Neue / Nunito ne sont pas embarquées.
const FONT_TITLE = 'Montserrat_Bold';
const FONT_BODY = 'Inter';
const IS_ANDROID = Platform.OS === 'android';

const RED = '#E10600';
const HALO_PAD = 6; // marge du halo autour de l'élément ciblé
const AVATAR_SIZE = 76;
const AVATAR_RESERVE = 60; // largeur réservée à l'avatar à droite de la bulle

interface HaloRect { left: number; top: number; width: number; height: number }
interface ArrowState { dir: 'up' | 'down'; left: number }

/**
 * Tooltip custom du tutoriel PoleWin.
 * - Bulle à gauche, avatar pilote à droite (débordant en bas)
 * - « Étape X / N », titre, corps, navigation + skip
 * - Flèche directionnelle + halo rouge pulsé sur l'élément mis en avant.
 *
 * Halo : positionné relativement à la bulle. On mesure la cible ET la bulle avec
 * measureInWindow (même repère → pas de décalage StatusBar sur Android) APRÈS la
 * stabilisation de la bulle (rn-tourguide l'anime ~1s), sinon le halo tombe à côté.
 */
export function PoleWinTooltip({
    isFirstStep,
    isLastStep,
    currentStep,
    handleNext,
    handlePrev,
    handleStop,
}: TooltipProps) {
    const { markTourDone } = usePoleWinTour();
    const { step, total, title, body } = parseTourStep(currentStep?.text);

    const rowRef = useRef<View>(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(16)).current;
    const pulse = useRef(new Animated.Value(0)).current;
    const bounce = useRef(new Animated.Value(0)).current;

    const [halo, setHalo] = useState<HaloRect | null>(null);
    const [arrow, setArrow] = useState<ArrowState | null>(null);

    // Anim d'entrée de la bulle à chaque changement d'étape.
    useEffect(() => {
        opacity.setValue(0);
        translateY.setValue(16);
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, [currentStep?.order, opacity, translateY]);

    // Positionne halo + flèche une fois la bulle stabilisée.
    useEffect(() => {
        let cancelled = false;
        setHalo(null);
        setArrow(null);

        const wrapper: any = currentStep?.wrapper ?? (currentStep?.target as any)?.wrapper;
        if (!wrapper || typeof wrapper.measureInWindow !== 'function') return;

        const timer = setTimeout(() => {
            if (cancelled || !rowRef.current) return;
            wrapper.measureInWindow((tx: number, ty: number, tw: number, th: number) => {
                if (cancelled || !rowRef.current || tw === 0) return;
                rowRef.current.measureInWindow((rx, ry, rw, rh) => {
                    if (cancelled) return;
                    // Coordonnées de la cible relatives à la bulle (même repère window).
                    setHalo({
                        left: tx - rx - HALO_PAD,
                        top: ty - ry - HALO_PAD,
                        width: tw + HALO_PAD * 2,
                        height: th + HALO_PAD * 2,
                    });
                    // Direction de la flèche : cible au-dessus ou en dessous de la bulle.
                    const dir: 'up' | 'down' = ty + th / 2 < ry + rh / 2 ? 'up' : 'down';
                    const bubbleRight = rw - AVATAR_RESERVE;
                    const left = Math.max(18, Math.min(tx + tw / 2 - rx, bubbleRight - 18));
                    setArrow({ dir, left });
                });
            });
        }, 1150);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [currentStep?.order]);

    // Boucle de pulsation du halo.
    useEffect(() => {
        if (!halo) return;
        pulse.setValue(0);
        const loop = Animated.loop(
            Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        );
        loop.start();
        return () => loop.stop();
    }, [halo, pulse]);

    // Petit rebond de la flèche pour attirer l'œil.
    useEffect(() => {
        if (!arrow) return;
        bounce.setValue(0);
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(bounce, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(bounce, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [arrow, bounce]);

    const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
    const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] });
    const bounceShift = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, arrow?.dir === 'up' ? -6 : 6] });

    const isLast = !!isLastStep;
    const handleSkip = () => {
        handleStop?.();
        markTourDone();
    };
    const handlePrimary = () => {
        if (isLast) {
            // Fin de CE sous-tour : on le ferme (→ marqué « vu »), mais on ne
            // termine pas tout l'onboarding (les autres sous-tours, ex. Pronos,
            // pourront encore s'afficher). Seul « Passer » termine tout.
            handleStop?.();
        } else {
            handleNext?.();
        }
    };
    const primaryLabel = isLast ? "C'est parti 🏁" : 'Suivant';

    return (
        <Animated.View ref={rowRef} style={[styles.row, { opacity, transform: [{ translateY }] }]}>
            {/* Halo rouge pulsé sur l'élément ciblé */}
            {halo && (
                <Animated.View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: halo.left,
                        top: halo.top,
                        width: halo.width,
                        height: halo.height,
                        borderRadius: 16,
                        borderWidth: 2.5,
                        borderColor: RED,
                        opacity: haloOpacity,
                        transform: [{ scale: haloScale }],
                    }}
                />
            )}

            {/* Flèche directionnelle vers l'élément */}
            {arrow && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.arrowBase,
                        { left: arrow.left - 8, transform: [{ translateY: bounceShift }] },
                        arrow.dir === 'up' ? styles.arrowUp : styles.arrowDown,
                    ]}
                />
            )}

            {/* Bulle */}
            <View style={styles.bubble}>
                {typeof step === 'number' && (
                    <Text allowFontScaling={false} style={styles.stepIndicator}>
                        Étape {step}{typeof total === 'number' ? ` / ${total}` : ''}
                    </Text>
                )}
                {!!title && <Text allowFontScaling={false} style={styles.title}>{title}</Text>}
                <Text allowFontScaling={false} style={styles.body}>{body}</Text>

                <View style={styles.actions}>
                    {!isFirstStep ? (
                        <TouchableOpacity onPress={() => handlePrev?.()} style={styles.prevBtn} activeOpacity={0.8}>
                            <Text allowFontScaling={false} style={styles.prevText}>Précédent</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.prevSpacer} />
                    )}
                    <TouchableOpacity onPress={handlePrimary} style={styles.nextBtn} activeOpacity={0.85}>
                        <Text allowFontScaling={false} style={styles.nextText}>{primaryLabel}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
                    <Text allowFontScaling={false} style={styles.skipText}>Passer le tutoriel</Text>
                </TouchableOpacity>
            </View>

            {/* Avatar pilote — débordant légèrement en bas */}
            <View style={styles.avatar} pointerEvents="none">
                <Image source={AVATAR_TUTO} style={styles.avatarImg} resizeMode="contain" />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        maxWidth: IS_ANDROID ? 300 : 330,
        alignSelf: 'center',
    },
    bubble: {
        flex: 1,
        backgroundColor: '#1A1A1D',
        borderWidth: 1.5,
        borderColor: RED,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 10,
        // réserve la place de l'avatar à droite (léger chevauchement voulu)
        marginRight: AVATAR_RESERVE,
    },
    stepIndicator: {
        color: RED,
        fontFamily: FONT_BODY,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        color: '#FFFFFF',
        fontFamily: FONT_TITLE,
        fontSize: IS_ANDROID ? 15 : 17,
        letterSpacing: 0.3,
        marginBottom: 4,
    },
    body: {
        color: '#F5F5F7',
        fontFamily: FONT_BODY,
        fontSize: IS_ANDROID ? 12 : 13,
        lineHeight: IS_ANDROID ? 16 : 18,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    prevBtn: { paddingVertical: 8, paddingHorizontal: 4 },
    prevSpacer: { flex: 0 },
    prevText: {
        color: 'rgba(245,245,247,0.7)',
        fontFamily: FONT_BODY,
        fontSize: 13,
        fontWeight: '600',
    },
    nextBtn: {
        backgroundColor: RED,
        borderRadius: 10,
        paddingVertical: 9,
        paddingHorizontal: 18,
    },
    nextText: {
        color: '#FFFFFF',
        fontFamily: FONT_BODY,
        fontSize: 14,
        fontWeight: '800',
    },
    skipBtn: { marginTop: 10, alignItems: 'center' },
    skipText: {
        color: 'rgba(245,245,247,0.4)',
        fontFamily: FONT_BODY,
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    avatar: {
        position: 'absolute',
        right: 0,
        bottom: -14,
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        zIndex: 10,
    },
    avatarImg: { width: AVATAR_SIZE, height: AVATAR_SIZE },
    arrowBase: {
        position: 'absolute',
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    arrowUp: {
        top: -9,
        borderBottomWidth: 9,
        borderBottomColor: RED,
    },
    arrowDown: {
        bottom: -9,
        borderTopWidth: 9,
        borderTopColor: RED,
    },
});

export default PoleWinTooltip;
