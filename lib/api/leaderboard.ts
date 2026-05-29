import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '@/lib/config';

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('@polewin/accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export interface PlayerRank {
    rank: number;       // calculé côté front (index + 1) si absent du backend
    userId?: number;
    username: string;
    displayName?: string;
    points: number;
    avatarUrl?: string;
}

export interface MyRank {
    rank: number;
    points: number;
    username: string;
}

export interface LeaderboardResponse {
    leaderboard: PlayerRank[];
    total?: number;
    page?: number;
    limit?: number;
}

export async function fetchGlobalLeaderboard(limit = 100, page = 1): Promise<PlayerRank[]> {
    const url = `${API_URL}/leaderboard?limit=${limit}&page=${page}`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch leaderboard');

        let items: Omit<PlayerRank, 'rank'>[] = [];
        if (Array.isArray(data))             items = data;
        else if (Array.isArray(data.items))       items = data.items;
        else if (Array.isArray(data.leaderboard)) items = data.leaderboard;
        else if (Array.isArray(data.data))        items = data.data;

        // Injecter le rang si le backend ne le fournit pas
        return items.map((p, i) => ({
            ...p,
            rank: (p as any).rank ?? i + 1,
        })) as PlayerRank[];
    } catch (error) {
        console.error('Leaderboard Fetch Error:', error);
        return [];
    }
}

export async function fetchMyRank(): Promise<MyRank | null> {
    const url = `${API_URL}/leaderboard/me`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) return null;
        const data = await response.json();
        return data || null;
    } catch (error) {
        console.error('My Rank Fetch Error:', error);
        return null;
    }
}

export async function fetchLeagueLeaderboard(leagueId: string, limit = 100): Promise<PlayerRank[]> {
    const url = `${API_URL}/leaderboard/leagues/${leagueId}?limit=${limit}`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch league leaderboard');
        return data.leaderboard || [];
    } catch (error) {
        console.error('League Leaderboard Fetch Error:', error);
        return [];
    }
}

export async function fetchSessionLeaderboard(sessionId: string, limit = 100): Promise<PlayerRank[]> {
    const url = `${API_URL}/leaderboard/sessions/${sessionId}?limit=${limit}`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch session leaderboard');
        return data.leaderboard || [];
    } catch (error) {
        console.error('Session Leaderboard Fetch Error:', error);
        return [];
    }
}

export async function fetchSessionLeagueLeaderboard(sessionId: string, leagueId: string, limit = 100): Promise<PlayerRank[]> {
    const url = `${API_URL}/leaderboard/sessions/${sessionId}/leagues/${leagueId}?limit=${limit}`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch leaderboard');
        return data.leaderboard || [];
    } catch (error) {
        console.error('Session+League Leaderboard Fetch Error:', error);
        return [];
    }
}
