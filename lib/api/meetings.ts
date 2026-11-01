import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '@/lib/config';

// In a real app, this would come from an auth context/storage
const getHeaders = async () => {
    const token = await AsyncStorage.getItem('@polewin/accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error: any) {
            const isLastAttempt = attempt === retries;
            if (isLastAttempt) throw error;

            console.warn(`[API] Attempt ${attempt + 1} failed for ${url}, retrying...`);
            const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('fetchWithRetry: unreachable');
}

export interface MeetingItem {
    meeting_key: number;
    meeting_name: string;
    meeting_official_name: string;
    location: string;
    country_key: number;
    country_code: string;
    country_name: string;
    country_flag: string;
    circuit_key: number;
    circuit_short_name: string;
    circuit_type: string;
    circuit_info_url: string;
    circuit_image: string;
    gmt_offset: string;
    date_start: string;
    date_end: string;
    year: number;
}

export async function fetchMeetings(year: number = new Date().getFullYear()): Promise<MeetingItem[]> {
    const url = `${API_URL}/openf1/calendar?year=${year}`;

    try {
        const response = await fetchWithRetry(url);
        const data = await response.json();
        return data.meetings || [];
    } catch (error) {
        console.error('Failed to fetch F1 meetings:', error);
        throw error;
    }
}

export interface SessionItem {
    session_key: number;
    meeting_key: number;
    session_name: string;
    session_type: string;
    date_start: string;
    date_end: string;
    year: number;
}

export async function fetchSessions(meetingKey: number, year: number = new Date().getFullYear()): Promise<SessionItem[]> {
    const url = `${API_URL}/openf1/sessions?meeting_key=${meetingKey}&year=${year}`;

    try {
        const response = await fetchWithRetry(url);
        const data = await response.json();
        return data.sessions || [];
    } catch (error) {
        console.error(`Failed to fetch F1 sessions for meeting ${meetingKey}:`, error);
        throw error;
    }
}

export interface SessionResult {
    position: number;
    driver_number: number;
    time?: number;
    driver?: {
        broadcast_name: string;
        full_name: string;
        name_acronym: string;
        team_name: string;
        team_colour: string;
    };
}

export async function fetchSessionResults(sessionKey: number): Promise<SessionResult[]> {
    const url = `${API_URL}/openf1/sessions/${sessionKey}/results`;

    try {
        const response = await fetchWithRetry(url);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error(`Failed to fetch F1 session results for session ${sessionKey}:`, error);
        throw error;
    }
}

export interface DriverStanding {
    /** Certains pilotes classés n'ont pas de numéro permanent publié. */
    driver_number: number | null;
    position: number;
    points: number;
    wins: number;
    driver?: {
        broadcast_name: string;
        full_name: string;
        name_acronym: string;
        team_name: string;
        team_colour: string;
        headshot_url: string;
        nationality?: string;
        driver_id?: string;
    };
}

export async function fetchDriverStandings(year: number = 2026): Promise<DriverStanding[]> {
    const url = `${API_URL}/openf1/standings/drivers?year=${year}`;

    try {
        const response = await fetchWithRetry(url);
        const data = await response.json();
        return data.standings || [];
    } catch (error) {
        console.error('Failed to fetch F1 driver standings:', error);
        throw error;
    }
}

export interface TeamStanding {
    team_name: string;
    team_id?: string;
    position: number;
    points: number;
    wins: number;
    team_colour: string;
    nationality?: string;
}

export async function fetchTeamStandings(year: number = 2026): Promise<TeamStanding[]> {
    const url = `${API_URL}/openf1/standings/teams?year=${year}`;

    try {
        const response = await fetchWithRetry(url);
        const data = await response.json();
        return data.standings || [];
    } catch (error) {
        console.error('Failed to fetch F1 team standings:', error);
        throw error;
    }
}

export interface RaceSession {
    id: number;
    idCourseExternal: number;
    name: string;
    type: string;
    location?: string;
    dateStart: string;
}

export async function fetchRaceSessions(limit: number = 50, upcomingOnly = true): Promise<RaceSession[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (upcomingOnly) params.set('upcoming', 'true');
    const url = `${API_URL}/sessions?${params.toString()}`;
    try {
        const response = await fetchWithRetry(url);
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Failed to fetch race sessions:', error);
        return [];
    }
}

/**
 * Récompense d'une option de prédiction : nombre de points de championnat gagnés
 * SI le pronostic est correct. Ce n'est pas une cote : rien n'est engagé.
 * `value = '*'` = valeur par défaut (pilote sans récompense dédiée).
 */
export interface RewardOption {
    value: string;
    rewardPoints: number;
    /** PODIUM : les 3 bons pilotes dans le désordre. */
    partialRewardPoints: number | null;
}

export interface Prediction {
    id: number;
    sessionId: number;
    type: string;
    closesAt: string;
    winningValue?: string;
    rewardOptions?: RewardOption[];
}

export interface Pronostic {
    id: number;
    predictionId: number;
    status: string;
    /** 'fixed_reward' = pronostic du championnat ; 'legacy_stake' = ancienne Saison Bêta. */
    scoringModel?: 'fixed_reward' | 'legacy_stake';
    /** Récompense figée au moment de la validation. */
    rewardPointsSnapshot?: number | null;
    partialRewardPointsSnapshot?: number | null;
    /** Points de championnat obtenus (0 si incorrect — jamais négatif). */
    championshipPointsAwarded?: number;
    detail?: {
        value: string;
    };
    prediction?: any;
}

/** Récompense affichée pour une valeur donnée (option dédiée, sinon option par défaut). */
export function rewardFor(prediction: Prediction, value: string | null | undefined): number | null {
    const options = prediction.rewardOptions ?? [];
    const key = prediction.type === 'PODIUM' ? '*' : value?.toUpperCase();
    const option = options.find((o) => o.value === key) ?? options.find((o) => o.value === '*');
    return option?.rewardPoints ?? null;
}

/** Fourchette de récompenses d'une prédiction (pour l'en-tête de carte). */
export function rewardRange(prediction: Prediction): { min: number; max: number } | null {
    const values = (prediction.rewardOptions ?? []).map((o) => o.rewardPoints);
    if (!values.length) return null;
    return { min: Math.min(...values), max: Math.max(...values) };
}

/** Erreur API lisible (le backend renvoie { status: 'error', message, code }). */
export class ApiError extends Error {
    constructor(public status: number, message: string, public code?: string) {
        super(message);
    }
}

async function parseOrThrow(response: Response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new ApiError(response.status, data?.message ?? 'Erreur inattendue', data?.code);
    }
    return data;
}

export interface Driver {
    driver_number: number;
    full_name: string;
    name_acronym: string;
    team_name: string;
    team_colour: string;
}

const DRIVER_STANDINGS_CACHE_MS = 5 * 60 * 1000;
const driverStandingsCache = new Map<number, { expiresAt: number; promise: Promise<Driver[]> }>();

function driversFromStandings(standings: any[]): Driver[] {
    const teamColors: Record<string, string> = {
        'Ferrari': 'E8002D',
        'McLaren': 'FF8000',
        'Mercedes': '27F4D2',
        'Red Bull': '3671C6',
        'Red Bull Racing': '3671C6',
        'Aston Martin': '229971',
        'Alpine': 'FF87BC',
        'Alpine F1 Team': 'FF87BC',
        'Williams': '64C4FF',
        'Haas F1 Team': 'B6BABD',
        'RB F1 Team': '6692FF',
        'Audi': 'E3000F',
        'Cadillac F1 Team': 'C0A060',
        'Kick Sauber': '52E252',
    };

    return standings
        .map((standing: any) => ({
            driver_number: standing.driver_number,
            full_name: standing.driver?.full_name || '',
            name_acronym: standing.driver?.name_acronym || '',
            team_name: standing.driver?.team_name || '',
            team_colour: standing.driver?.team_colour || teamColors[standing.driver?.team_name] || 'ffffff',
        }))
        .filter((driver: Driver) => driver.name_acronym);
}

async function fetchDriversFromStandings(year: number): Promise<Driver[]> {
    const cached = driverStandingsCache.get(year);
    if (cached && cached.expiresAt > Date.now()) return cached.promise;

    const promise = (async () => {
        const response = await fetchWithRetry(`${API_URL}/openf1/standings/drivers?year=${year}`);
        const data = await response.json();
        return driversFromStandings(data.standings || []);
    })();

    driverStandingsCache.set(year, {
        expiresAt: Date.now() + DRIVER_STANDINGS_CACHE_MS,
        promise,
    });

    try {
        return await promise;
    } catch (error) {
        driverStandingsCache.delete(year);
        throw error;
    }
}

export async function fetchPredictions(sessionId: number): Promise<Prediction[]> {
    const url = `${API_URL}/predictions/sessions/${sessionId}/predictions`;
    try {
        const response = await fetchWithRetry(url);
        const data = await response.json();
        return data.predictions || [];
    } catch (error) {
        console.error(`Failed to fetch predictions for session ${sessionId}:`, error);
        return [];
    }
}

export async function fetchDrivers(
    sessionKey: number,
    year = new Date().getFullYear(),
    previousSessionKey?: number,
): Promise<Driver[]> {
    const url = `${API_URL}/openf1/sessions/${sessionKey}/drivers`;
    try {
        // Une session future peut répondre 500 tant qu'OpenF1 n'a pas encore
        // publié sa liste. Réessayer la même requête ajoute plusieurs secondes
        // sans pouvoir changer le résultat, donc on bascule immédiatement.
        const response = await fetchWithRetry(url, 0);
        const data = await response.json();

        if (data.drivers && data.drivers.length > 0) {
            return data.drivers;
        }
    } catch (error) {
        console.warn(`Session drivers unavailable for ${sessionKey}, using standings fallback:`, error);
    }

    // En cas de remplacement en cours de week-end, la dernière session déjà
    // disputée contient la grille exacte (contrairement au classement saison).
    if (previousSessionKey && previousSessionKey !== sessionKey) {
        try {
            const response = await fetchWithRetry(
                `${API_URL}/openf1/sessions/${previousSessionKey}/drivers`,
                0,
            );
            const data = await response.json();
            if (data.drivers?.length > 0) return data.drivers;
        } catch (error) {
            console.warn(`Previous-session drivers unavailable for ${previousSessionKey}:`, error);
        }
    }

    try {
        return await fetchDriversFromStandings(year);
    } catch (error) {
        console.warn(`Failed to fetch fallback drivers for ${sessionKey}:`, error);
        return [];
    }
}

/**
 * Valide un pronostic. AUCUN montant n'est envoyé : la récompense est calculée
 * et figée par le serveur.
 */
export async function placePronostic(predictionId: number, value: string): Promise<Pronostic> {
    const url = `${API_URL}/predictions/${predictionId}/pronostic`;
    const headers = await getHeaders();
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ value }),
    });
    const data = await parseOrThrow(response);
    return data.pronostic;
}

/** Modifie le choix d'un pronostic (avant la clôture). */
export async function updatePronostic(predictionId: number, value: string): Promise<Pronostic> {
    const url = `${API_URL}/predictions/${predictionId}/pronostic`;
    const headers = await getHeaders();
    const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ value }),
    });
    const data = await parseOrThrow(response);
    return data.pronostic;
}

export async function deletePronostic(predictionId: number): Promise<void> {
    const url = `${API_URL}/predictions/${predictionId}/pronostic`;
    const headers = await getHeaders();
    const response = await fetch(url, { method: 'DELETE', headers });
    await parseOrThrow(response);
}

export async function fetchMyPronosticsHistory(limit = 50, offset = 0): Promise<Pronostic[]> {
    const url = `${API_URL}/predictions/users/me/pronostics?limit=${limit}&offset=${offset}`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Failed to fetch pronostics history:', error);
        return [];
    }
}

export async function fetchMyPronostic(predictionId: number): Promise<Pronostic | null> {
    const url = `${API_URL}/predictions/${predictionId}/pronostic`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, { headers });
        if (response.status === 404) return null;
        const data = await response.json();
        return data.pronostic || null;
    } catch (error) {
        console.error(`Failed to fetch my pronostic for prediction ${predictionId}:`, error);
        return null;
    }
}
export async function fetchMyPronosticsForSession(sessionId: number): Promise<Pronostic[]> {
    const url = `${API_URL}/predictions/sessions/${sessionId}/pronostics/me`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        return data.pronostics || [];
    } catch (error) {
        console.error(`Failed to fetch my pronostics for session ${sessionId}:`, error);
        return [];
    }
}

