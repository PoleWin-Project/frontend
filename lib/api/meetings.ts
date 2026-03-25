const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.6.0.177:8000/api/v1';

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
