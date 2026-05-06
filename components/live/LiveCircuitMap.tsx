import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

interface Location {
    x: number;
    y: number;
    driver_number: number;
}

interface Props {
    locations: Location[];
    trackPoints: { x: number, y: number }[];
    teamColors: Record<number, string>;
    size?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_MAP_SIZE = SCREEN_WIDTH - 40;
const PADDING = 24;

export function LiveCircuitMap({ locations, trackPoints, teamColors, size }: Props) {
    const MAP_SIZE = size ?? DEFAULT_MAP_SIZE;
    // 1. Calculate Bounds for Scaling — include both track points AND live driver
    // positions so the map auto-fits as soon as data arrives.
    const bounds = useMemo(() => {
        const all: { x: number; y: number }[] = [...trackPoints, ...locations];
        if (all.length < 1) return { minX: -10000, maxX: 10000, minY: -10000, maxY: 10000 };

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        all.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });

        const dx = (maxX - minX) || 1000;
        const dy = (maxY - minY) || 1000;
        return {
            minX: minX - dx * 0.1,
            maxX: maxX + dx * 0.1,
            minY: minY - dy * 0.1,
            maxY: maxY + dy * 0.1,
        };
    }, [trackPoints, locations]);

    const scale = useMemo(() => {
        const dx = bounds.maxX - bounds.minX;
        const dy = bounds.maxY - bounds.minY;
        const availableSize = MAP_SIZE - PADDING * 2;
        const s = Math.min(availableSize / dx, availableSize / dy);
        return Number.isFinite(s) && s > 0 ? s : 1;
    }, [bounds, MAP_SIZE]);

    // Center the bounding box inside the square viewport
    const offset = useMemo(() => {
        const dx = bounds.maxX - bounds.minX;
        const dy = bounds.maxY - bounds.minY;
        const drawnW = dx * scale;
        const drawnH = dy * scale;
        const inner = MAP_SIZE - PADDING * 2;
        return {
            x: PADDING + (inner - drawnW) / 2,
            y: PADDING + (inner - drawnH) / 2,
        };
    }, [bounds, scale, MAP_SIZE]);

    const transform = (x: number, y: number) => {
        return {
            x: offset.x + (x - bounds.minX) * scale,
            y: offset.y + (bounds.maxY - y) * scale, // Flip Y for SVG
        };
    };

    return (
        <View
            className="items-center justify-center bg-black/30 rounded-3xl border border-white/5 overflow-hidden"
            style={{ width: MAP_SIZE, height: MAP_SIZE }}
        >
            <Svg width={MAP_SIZE} height={MAP_SIZE}>
                {/* Track scatter — each collected point becomes a tiny dot. As
                    drivers cover the lap, the outline of the circuit emerges. */}
                {trackPoints.map((p, i) => {
                    const { x, y } = transform(p.x, p.y);
                    return (
                        <Circle
                            key={`tp-${i}`}
                            cx={x}
                            cy={y}
                            r={1.5}
                            fill="rgba(255,255,255,0.18)"
                        />
                    );
                })}

                {/* Drivers */}
                {locations.map((loc) => {
                    const { x, y } = transform(loc.x, loc.y);
                    const color = teamColors[loc.driver_number] ? `#${teamColors[loc.driver_number]}` : '#E10600';

                    return (
                        <G key={loc.driver_number}>
                            <Circle cx={x} cy={y} r={9} fill={color} opacity={0.25} />
                            <Circle
                                cx={x}
                                cy={y}
                                r={4.5}
                                fill={color}
                                stroke="white"
                                strokeWidth={1}
                            />
                            <SvgText
                                x={x + 7}
                                y={y - 6}
                                fill="white"
                                fontSize="9"
                                fontWeight="bold"
                                fontStyle="italic"
                            >
                                {loc.driver_number}
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
}
