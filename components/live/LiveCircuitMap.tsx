import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface Location {
    x: number;
    y: number;
    driver_number: number;
}

interface Props {
    locations: Location[];
    trackPoints: { x: number, y: number }[];
    teamColors: Record<number, string>;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_SIZE = SCREEN_WIDTH - 40;
const PADDING = 40;

export function LiveCircuitMap({ locations, trackPoints, teamColors }: Props) {
    // 1. Calculate Bounds for Scaling
    const bounds = useMemo(() => {
        if (trackPoints.length < 2) return { minX: -10000, maxX: 10000, minY: -10000, maxY: 10000 };
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        trackPoints.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });
        
        // Add padding
        const dx = maxX - minX;
        const dy = maxY - minY;
        return { 
            minX: minX - dx * 0.1, 
            maxX: maxX + dx * 0.1, 
            minY: minY - dy * 0.1, 
            maxY: maxY + dy * 0.1 
        };
    }, [trackPoints]);

    const scale = useMemo(() => {
        const dx = bounds.maxX - bounds.minX;
        const dy = bounds.maxY - bounds.minY;
        const availableSize = MAP_SIZE - PADDING * 2;
        return Math.min(availableSize / dx, availableSize / dy);
    }, [bounds]);

    const transform = (x: number, y: number) => {
        return {
            x: PADDING + (x - bounds.minX) * scale,
            y: PADDING + (bounds.maxY - y) * scale, // Flip Y for SVG
        };
    };

    // 2. Generate Track Path
    const d = useMemo(() => {
        if (trackPoints.length < 2) return "";
        return trackPoints.reduce((acc, p, i) => {
            const { x, y } = transform(p.x, p.y);
            return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
        }, "") + " Z";
    }, [trackPoints, scale, bounds]);

    return (
        <View className="items-center justify-center bg-black/20 rounded-[40px] border border-white/5 overflow-hidden" style={{ width: MAP_SIZE, height: MAP_SIZE }}>
            <Svg width={MAP_SIZE} height={MAP_SIZE}>
                {/* Track Background / Shadow */}
                <Path
                    d={d}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={12}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                
                {/* Actual Track Path */}
                <Path
                    d={d}
                    fill="none"
                    stroke="#333"
                    strokeWidth={8}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {/* Track Glow */}
                <Path
                    d={d}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={1}
                />

                {/* Drivers */}
                {locations.map((loc) => {
                    const { x, y } = transform(loc.x, loc.y);
                    const color = teamColors[loc.driver_number] ? `#${teamColors[loc.driver_number]}` : '#E10600';
                    
                    return (
                        <G key={loc.driver_number}>
                            {/* Halo / Glow */}
                            <Circle
                                cx={x}
                                cy={y}
                                r={8}
                                fill={color}
                                opacity={0.3}
                            />
                            {/* Main Dot */}
                            <Circle
                                cx={x}
                                cy={y}
                                r={4}
                                fill={color}
                                stroke="white"
                                strokeWidth={1}
                            />
                            {/* Driver Number Label */}
                            <SvgText
                                x={x + 6}
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
