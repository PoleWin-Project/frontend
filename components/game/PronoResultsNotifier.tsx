import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { fetchMyPronosticsHistory, type Pronostic } from '@/lib/api/meetings';
import { computeNewResolved, markResolvedSeen } from '@/lib/pronoResults';
import { PronoResultsPopup } from '@/components/game/PronoResultsPopup';

/**
 * Surveille les pronos de l'utilisateur et affiche une popup cumulative dès qu'un
 * ou plusieurs pronos viennent d'être résolus, à l'arrivée sur l'app et à chaque
 * retour au premier plan.
 *
 * À monter une seule fois (sibling du navigateur de tabs).
 */
export function PronoResultsNotifier() {
    const { user, isInitialized } = useAuth();
    const { active: demoActive } = useDemo();
    const router = useRouter();

    const [results, setResults] = useState<Pronostic[]>([]);
    const [visible, setVisible] = useState(false);
    const checkingRef = useRef(false);

    const checkResults = useCallback(async () => {
        if (!user || demoActive || checkingRef.current) return;
        // Ne pas écraser une popup déjà ouverte.
        if (visible) return;

        checkingRef.current = true;
        try {
            const history = await fetchMyPronosticsHistory();
            const { toAnnounce, isBaseline } = await computeNewResolved(history);
            if (!isBaseline && toAnnounce.length > 0) {
                // On marque comme vus immédiatement : la popup ne reviendra pas
                // même si l'app est fermée avant que l'utilisateur ne la lise.
                await markResolvedSeen(toAnnounce.map((p) => p.id));
                setResults(toAnnounce);
                setVisible(true);
            }
        } catch {
            // silencieux : on réessaiera au prochain passage au premier plan
        } finally {
            checkingRef.current = false;
        }
    }, [user, demoActive, visible]);

    // À l'arrivée (auth prête) puis à chaque login.
    useEffect(() => {
        if (isInitialized && user) checkResults();
    }, [isInitialized, user, checkResults]);

    // À chaque retour au premier plan.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
            if (next === 'active') checkResults();
        });
        return () => sub.remove();
    }, [checkResults]);

    if (!visible) return null;

    return (
        <PronoResultsPopup
            results={results}
            visible={visible}
            onClose={() => setVisible(false)}
            onSeeAll={() => {
                setVisible(false);
                router.push('/(tabs)/pronostics');
            }}
        />
    );
}
