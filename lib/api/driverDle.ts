import { API_URL } from '@/lib/config';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DriverDleRosterEntry {
  driverId: string;
  fullName: string;
  teamName: string;
  driverNumber: number;
  nationality: string;
  headshotUrl: string | null;
}

export type CategoricalStatus = 'exact' | 'wrong';
export type NumericStatus = 'exact' | 'higher' | 'lower';

export interface CategoricalFeedback {
  value: string;
  status: CategoricalStatus;
}

export interface NumericFeedback {
  value: number;
  status: NumericStatus;
}

export interface DriverDleGuessFeedback {
  driverId: string;
  fullName: string;
  headshotUrl: string | null;
  team: CategoricalFeedback;
  nationality: CategoricalFeedback;
  debutYear: NumericFeedback;
  wins: NumericFeedback;
  podiums: NumericFeedback;
}

export interface DriverDleGuessResult {
  status?: string;
  found: boolean;
  gameOver: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  feedback: DriverDleGuessFeedback;
  solution?: DriverDleRosterEntry;
  pointsEarned?: number;
  /** Renseigné côté client en cas d'erreur réseau/quota. */
  error?: string;
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function fetchRoster(accessToken: string): Promise<DriverDleRosterEntry[]> {
  try {
    const res = await fetch(`${API_URL}/driver-dle/roster`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.roster ?? [];
  } catch {
    return [];
  }
}

export async function submitGuess(
  accessToken: string,
  driverId: string,
): Promise<DriverDleGuessResult | { error: string }> {
  try {
    const res = await fetch(`${API_URL}/driver-dle/guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ driverId }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { error: json?.message ?? 'Erreur lors de la tentative' };
    }
    return json as DriverDleGuessResult;
  } catch {
    return { error: 'Erreur réseau' };
  }
}
