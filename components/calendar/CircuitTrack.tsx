import React, { useMemo, useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
    /** Points projetés en plan (cf. lib/circuits.ts). */
    points: { x: number; y: number }[];
    width: number;
    height: number;
    /** Couleur du tracé de base. */
    color?: string;
    strokeWidth?: number;
    /** Marge intérieure en px autour du tracé. */
    padding?: number;
    /** Activer l'animation d'une ligne parcourant le circuit */
    isAnimated?: boolean;
    /** Couleur de la ligne animée */
    animatedColor?: string;
}

/**
 * Dessine le tracé vectoriel d'un circuit (polyligne GeoJSON projetée) en SVG,
 * normalisé pour remplir la zone tout en conservant le ratio d'aspect.
 */
export function CircuitTrack({
    points,
    width,
    height,
    color = '#9ca3af',
    strokeWidth = 2.5,
    padding = 16,
    isAnimated = false,
    animatedColor = '#39ff14'
}: Props) {
    const { d, length } = useMemo(() => {
        if (points.length < 2) return { d: '', length: 0 };

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }

        const dx = maxX - minX || 1;
        const dy = maxY - minY || 1;
        const innerW = width - padding * 2;
        const innerH = height - padding * 2;
        const scale = Math.min(innerW / dx, innerH / dy);

        const drawnW = dx * scale;
        const drawnH = dy * scale;
        const offsetX = padding + (innerW - drawnW) / 2;
        const offsetY = padding + (innerH - drawnH) / 2;

        // Y inversé : la latitude croît vers le nord, l'axe SVG vers le bas.
        const project = (p: { x: number; y: number }) => ({
            x: offsetX + (p.x - minX) * scale,
            y: offsetY + (maxY - p.y) * scale,
        });

        const first = project(points[0]);
        let path = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
        let totalLength = 0;
        let lastPt = first;

        for (let i = 1; i < points.length; i++) {
            const { x, y } = project(points[i]);
            totalLength += Math.sqrt(Math.pow(x - lastPt.x, 2) + Math.pow(y - lastPt.y, 2));
            path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
            lastPt = { x, y };
        }

        // Fermer le circuit si le premier et dernier point sont proches
        const distToStart = Math.sqrt(Math.pow(lastPt.x - first.x, 2) + Math.pow(lastPt.y - first.y, 2));
        if (distToStart > 0 && distToStart < 50) {
            totalLength += distToStart;
            path += ` Z`;
        }

        return { d: path, length: totalLength };
    }, [points, width, height, padding]);

    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isAnimated && length > 0) {
            Animated.loop(
                Animated.timing(progress, {
                    toValue: 1,
                    duration: 4000,
                    easing: Easing.linear,
                    useNativeDriver: false,
                })
            ).start();
        }
    }, [isAnimated, length]);

    if (!d) return null;

    const strokeDashoffset = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [length, 0],
    });

    return (
        <View style={{ width, height }}>
            <Svg width={width} height={height}>
                {/* Tracé de fond */}
                <Path
                    d={d}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    fill="none"
                />
                
                {/* Ligne animée par dessus */}
                {isAnimated && length > 0 && (
                    <AnimatedPath
                        d={d}
                        stroke={animatedColor}
                        strokeWidth={strokeWidth + 0.5}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={`${length / 6} ${length - length / 6}`}
                        strokeDashoffset={strokeDashoffset}
                    />
                )}
            </Svg>
        </View>
    );
}
