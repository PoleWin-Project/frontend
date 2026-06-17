import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Pronostic } from '@/lib/api/meetings';

const SEEN_KEY = '@polewin/seenResolvedPronos';

/** Statuts considérés comme « résolus » (le prono a un résultat définitif). */
const RESOLVED_STATUSES = ['won', 'lost', 'void'];

export function isResolved(prono: Pronostic): boolean {
    return RESOLVED_STATUSES.includes(prono.status);
}

/** IDs des pronos résolus déjà annoncés à l'utilisateur. */
export async function getSeenResolvedIds(): Promise<number[]> {
    try {
        const raw = await AsyncStorage.getItem(SEEN_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'number') : [];
    } catch {
        return [];
    }
}

/** Marque une liste d'IDs comme déjà annoncés (fusionne avec l'existant). */
export async function markResolvedSeen(ids: number[]): Promise<void> {
    try {
        const existing = await getSeenResolvedIds();
        const merged = Array.from(new Set([...existing, ...ids]));
        await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(merged));
    } catch {
        // best-effort : si l'écriture échoue, on ré-affichera la popup au prochain lancement
    }
}

/** Indique si une clé « vus » existe déjà (false = tout premier lancement de la feature). */
export async function hasSeenBaseline(): Promise<boolean> {
    try {
        return (await AsyncStorage.getItem(SEEN_KEY)) !== null;
    } catch {
        return false;
    }
}

export interface NewResolvedResult {
    /** Pronos nouvellement résolus, à annoncer dans la popup. */
    toAnnounce: Pronostic[];
    /** True si c'est le premier passage : on enregistre la baseline sans rien afficher. */
    isBaseline: boolean;
}

/**
 * À partir de l'historique complet, détermine les pronos résolus qui n'ont
 * pas encore été annoncés.
 *
 * Au tout premier passage (aucune baseline en storage), on ne montre rien :
 * on se contente d'enregistrer l'existant pour ne pas déballer tout l'historique.
 */
export async function computeNewResolved(history: Pronostic[]): Promise<NewResolvedResult> {
    const resolved = history.filter(isResolved);
    const baselineExists = await hasSeenBaseline();

    if (!baselineExists) {
        await markResolvedSeen(resolved.map((p) => p.id));
        return { toAnnounce: [], isBaseline: true };
    }

    const seen = new Set(await getSeenResolvedIds());
    const toAnnounce = resolved.filter((p) => !seen.has(p.id));
    return { toAnnounce, isBaseline: false };
}
