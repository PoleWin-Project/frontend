import { API_URL } from '@/lib/config';

export interface DmMessage {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    isRead: boolean;
    createdAt: string;
    sender?: { id: number; username: string; profile?: { avatarUrl: string | null; displayName: string | null } | null };
}

export interface Conversation {
    partnerId: number;
    partner?: { id: number; username: string; profile?: { avatarUrl: string | null; displayName: string | null } | null };
    lastMessage: DmMessage;
}

async function authFetch(url: string, token: string, init?: RequestInit) {
    return fetch(url, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(init?.headers ?? {}),
        },
    });
}

export async function fetchConversations(token: string): Promise<Conversation[]> {
    try {
        const res = await authFetch(`${API_URL}/dms`, token);
        const data = await res.json();
        return data.items ?? [];
    } catch { return []; }
}

export async function fetchMessages(userId: number, token: string, before?: number): Promise<DmMessage[]> {
    const params = new URLSearchParams({ limit: '40' });
    if (before !== undefined) params.set('before', String(before));
    try {
        const res = await authFetch(`${API_URL}/dms/${userId}?${params}`, token);
        const data = await res.json();
        return data.messages ?? [];
    } catch { return []; }
}

export async function sendDm(toUserId: number, content: string, token: string): Promise<DmMessage | null> {
    try {
        const res = await authFetch(`${API_URL}/dms/${toUserId}`, token, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.message ?? null;
    } catch { return null; }
}

export async function fetchUnreadCount(token: string): Promise<number> {
    try {
        const res = await authFetch(`${API_URL}/dms/unread`, token);
        const data = await res.json();
        return data.count ?? 0;
    } catch { return 0; }
}
