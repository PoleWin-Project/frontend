import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

interface Location {
    x: number;
    y: number;
    driver_number: number;
}

interface DriverPath {
    driver_number: number;
    path: { x: number; y: number }[];
}

interface Props {
    locations: Location[];
    /** Mode démo : trajectoires multi-waypoints. Si présent, prend le pas sur `locations`. */
    paths?: DriverPath[];
    /** Durée pendant laquelle on doit consommer le path en cours (ms). */
    pathDurationMs?: number;
    trackPoints: { x: number, y: number }[];
    teamColors: Record<number, string>;
    size?: number;
    /** Durée d'interpolation entre deux mises à jour des positions (ms). */
    tweenMs?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_MAP_SIZE = SCREEN_WIDTH - 40;
const PADDING = 24;

/**
 * Mode démo : on a reçu un `path` de N waypoints par pilote couvrant la
 * fenêtre de la frame courante. On anime à 60fps en lerpant entre les
 * waypoints consécutifs → le dot suit la VRAIE courbe du circuit au lieu
 * de couper en ligne droite entre deux polls éloignés.
 */
function usePathAnimation(
    paths: DriverPath[] | undefined,
    durationMs: number,
): Location[] {
    const [display, setDisplay] = useState<Location[]>([]);
    const pathsRef = useRef<DriverPath[]>([]);
    const startRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (!paths || paths.length === 0) return;
        pathsRef.current = paths;
        startRef.current = Date.now();

        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

        const tick = () => {
            const elapsed = Date.now() - startRef.current;
            const t = Math.max(0, Math.min(1, elapsed / durationMs));
            const next: Location[] = [];

            for (const dp of pathsRef.current) {
                if (!dp.path || dp.path.length === 0) continue;
                if (dp.path.length === 1) {
                    next.push({ driver_number: dp.driver_number, x: dp.path[0].x, y: dp.path[0].y });
                    continue;
                }
                // Position sur la polyligne à la fraction t
                const segs = dp.path.length - 1;
                const f = t * segs;
                const iA = Math.min(segs - 1, Math.floor(f));
                const u = f - iA;
                const a = dp.path[iA];
                const b = dp.path[iA + 1];
                next.push({
                    driver_number: dp.driver_number,
                    x: a.x + (b.x - a.x) * u,
                    y: a.y + (b.y - a.y) * u,
                });
            }
            setDisplay(next);

            // On continue à animer même au-delà de t=1 (au cas où le poll
            // suivant arrive en retard) — on reste figé sur le dernier waypoint.
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        };
    }, [paths, durationMs]);

    return display;
}

function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Mode live classique : tween linéaire entre la position précédente et la nouvelle. */
function useSmoothLocations(target: Location[], tweenMs: number, enabled: boolean): Location[] {
    const [display, setDisplay] = useState<Location[]>(target);
    const fromRef = useRef<Map<number, Location>>(new Map());
    const toRef = useRef<Map<number, Location>>(new Map());
    const startRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) return;
        const fromMap = new Map<number, Location>();
        for (const d of display) fromMap.set(d.driver_number, d);
        const toMap = new Map<number, Location>();
        for (const t of target) {
            toMap.set(t.driver_number, t);
            if (!fromMap.has(t.driver_number)) fromMap.set(t.driver_number, t);
        }

        fromRef.current = fromMap;
        toRef.current = toMap;
        startRef.current = Date.now();

        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        const tick = () => {
            const elapsed = Date.now() - startRef.current;
            const t = Math.max(0, Math.min(1, elapsed / tweenMs));
            const eased = easeInOut(t);

            const next: Location[] = [];
            for (const [num, to] of toRef.current.entries()) {
                const from = fromRef.current.get(num) ?? to;
                next.push({
                    driver_number: num,
                    x: from.x + (to.x - from.x) * eased,
                    y: from.y + (to.y - from.y) * eased,
                });
            }
            setDisplay(next);

            if (t < 1) rafRef.current = requestAnimationFrame(tick);
            else rafRef.current = null;
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, tweenMs, enabled]);

    return display;
}

export function LiveCircuitMap({ locations, paths, pathDurationMs = 400, trackPoints, teamColors, size, tweenMs = 1800 }: Props) {
    const MAP_SIZE = size ?? DEFAULT_MAP_SIZE;
    const usePaths = !!(paths && paths.length);
    const animated = usePathAnimation(usePaths ? paths : undefined, pathDurationMs);
    const smooth = useSmoothLocations(locations, tweenMs, !usePaths);
    const display = usePaths ? animated : smooth;

    const bounds = useMemo(() => {
        const all: { x: number; y: number }[] = [...trackPoints, ...(usePaths ? animated : locations)];
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
    }, [trackPoints, locations, animated, usePaths]);

    const scale = useMemo(() => {
        const dx = bounds.maxX - bounds.minX;
        const dy = bounds.maxY - bounds.minY;
        const availableSize = MAP_SIZE - PADDING * 2;
        const s = Math.min(availableSize / dx, availableSize / dy);
        return Number.isFinite(s) && s > 0 ? s : 1;
    }, [bounds, MAP_SIZE]);

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
            y: offset.y + (bounds.maxY - y) * scale,
        };
    };

    return (
        <View
            className="items-center justify-center bg-black/30 rounded-3xl border border-white/5 overflow-hidden"
            style={{ width: MAP_SIZE, height: MAP_SIZE }}
        >
            <Svg width={MAP_SIZE} height={MAP_SIZE}>
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

                {display.map((loc) => {
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
