import { API_URL } from '@/lib/config';

export interface FriendProfile {
    avatarUrl: string | null;
    displayName: string | null;
    points: number;
}

export interface FriendUser {
    id: number;
    username: string;
    profile?: FriendProfile | null;
}

export interface FriendRequest {
    id: number;
    senderId: number;
    receiverId: number;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
    sender?: FriendUser;
    receiver?: FriendUser;
}

export interface FriendStatus {
    status: 'none' | 'pending' | 'accepted' | 'declined' | 'self';
    requestId?: number;
    isSender?: boolean;
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

export async function sendFriendRequest(receiverId: number, token: string) {
    const res = await authFetch(`${API_URL}/friends/requests`, token, {
        method: 'POST',
        body: JSON.stringify({ receiverId }),
    });
    const data = await res.json();
    return { ok: res.ok, data, error: data.message };
}

export async function respondToRequest(requestId: number, action: 'accept' | 'decline', token: string) {
    const res = await authFetch(`${API_URL}/friends/requests/${requestId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
    });
    const data = await res.json();
    return { ok: res.ok, data, error: data.message };
}

export async function cancelRequest(requestId: number, token: string) {
    const res = await authFetch(`${API_URL}/friends/requests/${requestId}`, token, { method: 'DELETE' });
    return { ok: res.ok };
}

export async function unfriend(userId: number, token: string) {
    const res = await authFetch(`${API_URL}/friends/${userId}`, token, { method: 'DELETE' });
    return { ok: res.ok };
}

export async function fetchFriends(token: string): Promise<FriendRequest[]> {
    try {
        const res = await authFetch(`${API_URL}/friends`, token);
        const data = await res.json();
        return data.items ?? [];
    } catch { return []; }
}

export async function fetchIncomingRequests(token: string): Promise<FriendRequest[]> {
    try {
        const res = await authFetch(`${API_URL}/friends/requests/incoming`, token);
        const data = await res.json();
        return data.items ?? [];
    } catch { return []; }
}

export async function fetchFriendStatus(userId: number, token: string): Promise<FriendStatus> {
    try {
        const res = await authFetch(`${API_URL}/friends/status/${userId}`, token);
        const data = await res.json();
        const f = data.friendship ?? data;
        return { status: f.status, requestId: f.requestId, isSender: f.isSender };
    } catch { return { status: 'none' }; }
}
