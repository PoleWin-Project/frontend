import { API_URL } from '@/lib/config';

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Badge {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    imageUrl: string | null;
    rarity: BadgeRarity | null;
    createdAt: string;
}

export interface UserBadge {
    id: number;
    userId: number;
    badgeId: number;
    awardedAt: string;
    badge: Badge;
}

export async function fetchUserBadges(
    userId: number,
    accessToken?: string,
): Promise<UserBadge[]> {
    try {
        const headers: Record<string, string> = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const res = await fetch(`${API_URL}/users/${userId}/badges`, { headers });
        const data = await res.json();
        return data.badges ?? [];
    } catch {
        return [];
    }
}

export async function fetchMyBadges(accessToken: string): Promise<UserBadge[]> {
    try {
        const res = await fetch(`${API_URL}/users/me/badges`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        return data.badges ?? [];
    } catch {
        return [];
    }
}

export async function fetchAllBadges(): Promise<Badge[]> {
    try {
        const res = await fetch(`${API_URL}/badges`);
        const data = await res.json();
        return data.badges ?? [];
    } catch {
        return [];
    }
}