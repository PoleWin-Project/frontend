// Use the EXPO_PUBLIC_API_URL from .env which is mapped to the computer's actual IP address instead of 'localhost'
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.13:8000/api/v1';

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
    date_start: string; // ISO string 2026-08-21T10:30:00+00:00
    date_end: string;
    year: number;
}

/**
 * Fetches F1 meetings (races) for a specific year from the custom local backend.
 */
export async function fetchMeetings(year: number = new Date().getFullYear()): Promise<MeetingItem[]> {
    const url = `${API_URL}/openf1/calendar?year=${year}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error fetching meetings for year ${year}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.meetings || [];
    } catch (error) {
        console.error('Failed to fetch F1 meetings:', error);
        throw error;
    }
}

/**
 * Interface representing a single session during a Grand Prix weekend.
 */
export interface SessionItem {
    session_key: number;
    meeting_key: number;
    session_name: string; // e.g. "Practice 1", "Qualifying", "Race"
    session_type: string;
    date_start: string;
    date_end: string;
    year: number;
}

/**
 * Fetches sessions for a specific meeting (Grand Prix).
 * Example URL: http://localhost:8000/api/v1/openf1/sessions?meeting_key=1279&year=2026
 */
export async function fetchSessions(meetingKey: number, year: number = new Date().getFullYear()): Promise<SessionItem[]> {
    const url = `${API_URL}/openf1/sessions?meeting_key=${meetingKey}&year=${year}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error fetching sessions for meeting ${meetingKey}: ${response.statusText}`);
        }

        const data = await response.json();
        // Assuming the backend returns { sessions: [...] } similarly to meetings
        return data.sessions || [];
    } catch (error) {
        console.error(`Failed to fetch F1 sessions for meeting ${meetingKey}:`, error);
        throw error;
    }
}
