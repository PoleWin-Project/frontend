import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('@polewin/accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export interface PlayerRank {
    rank: number;
    username: string;
    points: number;
    avatarUrl?: string;
}

export async function fetchGlobalLeaderboard(): Promise<PlayerRank[]> {
    const url = `${API_URL}/leaderboard`;
    const headers = await getHeaders();

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.message || 'Failed to fetch leaderboard');
        
        return data.leaderboard || [];
    } catch (error) {
        console.error('Leaderboard Fetch Error:', error);
        return [];
    }
}

export async function fetchLeagueLeaderboard(leagueId: string): Promise<PlayerRank[]> {
    const url = `${API_URL}/leaderboard/leagues/${leagueId}`;
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
