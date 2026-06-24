/**
 * Onboarding interactif PoleWin — constantes & helpers partagés.
 *
 * Le tour est découpé en *sous-tours par écran* (un `tourKey` par écran),
 * car les écrans vivent dans des onglets / routes différents et rn-tourguide
 * ne sait pas naviguer entre eux. Chaque sous-tour s'auto-déclenche la
 * première fois que son écran est affiché (tant que l'onboarding n'est pas
 * terminé), ce qui révèle progressivement les 9 étapes.
 */

export const TOUR_DONE_KEY = 'polewin_tour_done';
export const TOUR_SEEN_KEY = 'polewin_tour_seen';

export type TourKey =
    | 'home'
    | 'championnat'
    | 'pronostics'
    | 'garage'
    | 'classement'
    | 'search'
    | 'messages'
    | 'profile';

/** Ordre de progression logique des sous-tours. */
export const TOUR_ORDER: TourKey[] = [
    'home',
    'championnat',
    'pronostics',
    'garage',
    'classement',
    'search',
    'messages',
    'profile',
];

export interface ParsedTourStep {
    step?: number;
    total?: number;
    title?: string;
    body: string;
}

/**
 * Encode le contenu d'une étape dans le champ `text` d'une `TourGuideZone`.
 * Le n° d'étape (X) et le total (N) sont relatifs au sous-tour de l'écran
 * → le tooltip affiche « Étape X / N » sans registre externe.
 */
export function tourStep(step: number, total: number, title: string, body: string): string {
    return JSON.stringify({ step, total, title, body });
}

/** Décode le `text` reçu par le tooltip (retombe sur du texte brut si besoin). */
export function parseTourStep(text?: string): ParsedTourStep {
    if (!text) return { body: '' };
    try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object' && 'body' in parsed) {
            return parsed;
        }
    } catch {
        // texte non-JSON : on l'affiche tel quel
    }
    return { body: text };
}
