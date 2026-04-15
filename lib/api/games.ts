const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
