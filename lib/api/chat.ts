import { API_URL } from '@/lib/config';

export interface ChatChannel {
    id: number;
    name: string;
    sessionId: number;
}

export interface ChatMessage {
    id: number;
    channelId: number;
    senderId: number;
    content: string;
    createdAt: string;
    sender?: { id: number; username: string } | null;
}

export async function fetchSessionChatChannel(sessionKey: number): Promise<ChatChannel | null> {
    try {
        const res = await fetch(`${API_URL}/openf1/sessions/${sessionKey}/chat-channels`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.channel ?? null;
    } catch {
        return null;
    }
}

export async function fetchMessages(
    channelId: number,
    opts: { limit?: number; after?: number; before?: number } = {}
): Promise<ChatMessage[]> {
    const params = new URLSearchParams();
    params.set('limit', String(opts.limit ?? 50));
    if (opts.after !== undefined) params.set('after', String(opts.after));
    if (opts.before !== undefined) params.set('before', String(opts.before));

    try {
        const res = await fetch(`${API_URL}/chat-channels/${channelId}/channel-messages?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        // messages are returned DESC (newest first), reverse to display oldest first
        return (data.items ?? []).reverse();
    } catch {
        return [];
    }
}

export async function sendMessage(
    channelId: number,
    content: string,
    token: string
): Promise<ChatMessage | null> {
    try {
        const res = await fetch(`${API_URL}/chat-channels/${channelId}/channel-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.channelMessage ?? data.message ?? null;
    } catch {
        return null;
    }
}
