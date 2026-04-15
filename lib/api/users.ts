const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface SearchUser {
  id: number;
  username: string;
  profile?: {
    displayName: string | null;
    avatarUrl: string | null;
    points: number;
    isProfilePublic: boolean;
  } | null;
}

export async function searchUsers(q: string, accessToken: string): Promise<SearchUser[]> {
  if (!q.trim()) return [];
  try {
    const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return data.users ?? [];
  } catch {
    return [];
  }
}

export type UpdateProfileInput = {
  profile: {
    favoriteTeamCode?: string | null;
    favoriteDriverCode?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    displayName?: string | null;
    isProfilePublic?: boolean;
  };
};

export async function updateUserProfile(
  data: UpdateProfileInput,
  accessToken: string
): Promise<{ ok: true; user: any } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (!res.ok || result.status === 'error') {
      return { ok: false, error: result.message || 'Impossible de mettre à jour le profil' };
    }

    return {
      ok: true,
      user: result.user,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau';
    return { ok: false, error: msg };
  }
}

export async function deleteUserAccount(
  accessToken: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const result = await res.json();
      return { ok: false, error: result.message || 'Erreur lors de la suppression' };
    }

    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau';
    return { ok: false, error: msg };
  }
}

export type UserStats = {
  total: number;
  won: number;
  lost: number;
  pending: number;
  winRate: number;
  totalStaked: number;
  totalEarned: number;
  netGain: number;
};

export async function fetchUserStats(
  accessToken: string
): Promise<{ ok: true; stats: UserStats } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/users/me/stats`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const result = await res.json();

    if (!res.ok || result.status === 'error') {
      return { ok: false, error: result.message || 'Impossible de récupérer les stats' };
    }

    return {
      ok: true,
      stats: result.stats,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau';
    return { ok: false, error: msg };
  }
}
