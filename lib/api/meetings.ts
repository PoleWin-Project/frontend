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
    driver_number: number;
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

export interface Prediction {
    id: number;
    sessionId: number;
    type: string;
    closesAt: string;
}

export interface Pronostic {
    id: number;
    predictionId: number;
    pointsStaked: number;
    pointsEarned: number;
    status: string;
    detail?: {
        value: string;
        multiplier: number;
    };
    prediction?: any;
}

export interface Driver {
    driver_number: number;
    full_name: string;
    name_acronym: string;
    team_name: string;
    team_colour: string;
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

export async function fetchDrivers(sessionKey: number): Promise<Driver[]> {
    const url = `${API_URL}/openf1/sessions/${sessionKey}/drivers`;
    try {
        const response = await fetchWithRetry(url);
        const data = await response.json();

        if (data.drivers && data.drivers.length > 0) {
            return data.drivers;
        }

        // Fallback: si aucun pilote n'est dispo pour cette session (ex: événement futur),
        // on récupère les pilotes via le classement de l'année en cours.
        const year = new Date().getFullYear();
        const standingsUrl = `${API_URL}/openf1/standings/drivers?year=${year}`;
        const standingsResponse = await fetchWithRetry(standingsUrl);
        const standingsData = await standingsResponse.json();

        if (standingsData.standings && standingsData.standings.length > 0) {
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
                'Kick Sauber': '52E252'
            };
            return standingsData.standings
                .map((s: any) => ({
                    driver_number: s.driver_number,
                    full_name: s.driver?.full_name || '',
                    name_acronym: s.driver?.name_acronym || '',
                    team_name: s.driver?.team_name || '',
                    team_colour: s.driver?.team_colour || teamColors[s.driver?.team_name] || 'ffffff',
                }))
                .filter((d: Driver) => d.name_acronym);
        }

        return [];
    } catch (error) {
        console.warn(`Failed to fetch drivers for session ${sessionKey}:`, error);
        return [];
    }
}

export async function placePronostic(predictionId: number, pointsStaked: number, value: string): Promise<any> {
    const url = `${API_URL}/predictions/${predictionId}/pronostic`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ pointsStaked, value }),
        });
        return await response.json();
    } catch (error) {
        console.error(`Failed to place pronostic for prediction ${predictionId}:`, error);
        throw error;
    }
}

export async function updatePronostic(predictionId: number, pointsStaked: number, value: string): Promise<any> {
    const url = `${API_URL}/predictions/${predictionId}/pronostic`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ pointsStaked, value }),
        });
        return await response.json();
    } catch (error) {
        console.error(`Failed to update pronostic for prediction ${predictionId}:`, error);
        throw error;
    }
}

export async function deletePronostic(predictionId: number): Promise<any> {
    const url = `${API_URL}/predictions/${predictionId}/pronostic`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers,
        });
        return await response.json();
    } catch (error) {
        console.error(`Failed to delete pronostic for prediction ${predictionId}:`, error);
        throw error;
    }
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

