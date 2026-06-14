import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
    /** Points projetés en plan (cf. lib/circuits.ts). */
    points: { x: number; y: number }[];
    width: number;
    height: number;
    /** Couleur du tracé. */
    color?: string;
    strokeWidth?: number;
    /** Marge intérieure en px autour du tracé. */
    padding?: number;
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
}: Props) {
    const d = useMemo(() => {
        if (points.length < 2) return '';

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
        for (let i = 1; i < points.length; i++) {
            const { x, y } = project(points[i]);
            path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
        }
        return path;
    }, [points, width, height, padding]);

    if (!d) return null;

    return (
        <View style={{ width, height }}>
            <Svg width={width} height={height}>
                <Path
                    d={d}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    fill="none"
                />
            </Svg>
        </View>
    );
}
