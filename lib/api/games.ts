const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface PlaysToday {
  played: number;       // parties jouées aujourd'hui
  limit: number | null; // null = illimité (admin)
}

export async function fetchPlaysToday(accessToken: string, gameId: string): Promise<PlaysToday> {
  try {
    const res = await fetch(`${API_URL}/games/plays-today?gameId=${gameId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return { played: 0, limit: 3 };
    return await res.json();
  } catch {
    return { played: 0, limit: 3 };
  }
}

export async function rewardUser(accessToken: string, points: number, gameId: string) {
    try {
        const res = await fetch(`${API_URL}/games/reward`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ points, gameId })
        });
        return await res.json();
    } catch (e) {
        console.error("Error rewarding user:", e);
        return { status: 'error', message: 'Erreur réseau' };
    }
}
