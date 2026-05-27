import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ─── Configuration de la démo Monaco 2024 ───────────────────────────────
export const DEMO_SESSION_KEY = 9523;            // OpenF1 Monaco GP 2024 Race
export const DEMO_PRE_RACE_SEC = 60;             // 1 minute de pronos (réglable)
export const DEMO_RACE_DURATION_SEC = 60;        // 1 minute de replay (réglable)
export const DEMO_WINNER_ACRONYM = 'LEC';        // Leclerc a gagné Monaco 2024

export interface DemoState {
    active: boolean;
    raceStartsAt: string | null;   // ISO quand la course "démarre"
    pick: string | null;            // pilote parié (acronyme)
    stake: number;                  // points misés
}

interface DemoContextValue extends DemoState {
    startDemo: () => void;
    cancelDemo: () => void;
    placeDemoPick: (driverAcronym: string, stake: number) => void;
    endDemo: () => { won: boolean; winner: string } | null;
}

const initialState: DemoState = {
    active: false,
    raceStartsAt: null,
    pick: null,
    stake: 0,
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<DemoState>(initialState);

    const startDemo = useCallback(() => {
        const raceStartsAt = new Date(Date.now() + DEMO_PRE_RACE_SEC * 1000).toISOString();
        setState({ active: true, raceStartsAt, pick: null, stake: 0 });
        // Warm up backend cache pour que les locations soient prêtes dans 5 min
        fetch(`${API_URL}/openf1/demo/${DEMO_SESSION_KEY}/warmup`).catch(() => undefined);
    }, []);

    const cancelDemo = useCallback(() => {
        setState(initialState);
    }, []);

    const placeDemoPick = useCallback((driverAcronym: string, stake: number) => {
        setState(s => ({ ...s, pick: driverAcronym, stake }));
    }, []);

    const endDemo = useCallback(() => {
        if (!state.active || !state.pick) {
            setState(initialState);
            return null;
        }
        const won = state.pick.toUpperCase() === DEMO_WINNER_ACRONYM;
        const result = { won, winner: DEMO_WINNER_ACRONYM };
        setState(initialState);
        return result;
    }, [state.active, state.pick]);

    // Auto-cancel if user leaves the demo dormant > 30 min
    useEffect(() => {
        if (!state.active || !state.raceStartsAt) return;
        const expiresAt = new Date(state.raceStartsAt).getTime() + (DEMO_RACE_DURATION_SEC + 600) * 1000;
        const id = setTimeout(() => setState(initialState), Math.max(0, expiresAt - Date.now()));
        return () => clearTimeout(id);
    }, [state.active, state.raceStartsAt]);

    return (
        <DemoContext.Provider value={{ ...state, startDemo, cancelDemo, placeDemoPick, endDemo }}>
            {children}
        </DemoContext.Provider>
    );
}

export function useDemo() {
    const ctx = useContext(DemoContext);
    if (!ctx) throw new Error('useDemo must be used within DemoProvider');
    return ctx;
}
