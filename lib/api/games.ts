import type { Appearance } from './paddock';
import { API_URL } from '@/lib/config';

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

export interface RewardResult {
  status: string;
  /** Crédits Garage gagnés, calculés par le serveur. */
  rewarded?: number;
  /** Nouveau solde de crédits Garage. */
  newTotal?: number;
  currency?: 'garage_credits' | 'legacy_points';
  playsToday?: number;
  playsLeft?: number | null;
  message?: string;
}

/**
 * Déclare la fin d'une partie de mini-jeu. Le client n'envoie que son résultat
 * (`metricMs`) : le montant de la récompense est calculé par le serveur.
 */
export async function rewardUser(
    accessToken: string,
    gameId: string,
    metricMs: number,
): Promise<RewardResult> {
    try {
        const res = await fetch(`${API_URL}/games/reward`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ gameId, metricMs })
        });
        return await res.json();
    } catch (e) {
        console.error("Error rewarding user:", e);
        return { status: 'error', message: 'Erreur réseau' };
    }
}

export async function recordFalseStart(accessToken: string, gameId: string) {
    try {
        const res = await fetch(`${API_URL}/games/false-start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ gameId })
        });
        return await res.json();
    } catch (e) {
        console.error("Error recording false start:", e);
        return { status: 'error', message: 'Erreur réseau' };
    }
}

export interface LeaderboardEntry {
    cosmetics?: Appearance;
    rank: number;
    userId: number;
    displayName: string | null;
    avatarUrl: string | null;
    bestMs: number;
    isMe: boolean;
}

export interface Leaderboard {
    entries: LeaderboardEntry[];
    me: LeaderboardEntry | null;
}

export async function fetchLeaderboard(accessToken: string, gameId: string): Promise<Leaderboard> {
    try {
        const res = await fetch(`${API_URL}/games/leaderboard?gameId=${gameId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return { entries: [], me: null };
        const json = await res.json();
        return { entries: json.entries ?? [], me: json.me ?? null };
    } catch {
        return { entries: [], me: null };
    }
}
