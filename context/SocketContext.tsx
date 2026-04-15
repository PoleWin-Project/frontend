import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

// Build ws:// URL from the API URL
const WS_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1')
    .replace('/api/v1', '')
    .replace(/^http/, 'ws');

type EventHandler = (data: any) => void;

interface SocketContextValue {
    isConnected: boolean;
    on: (event: string, handler: EventHandler) => () => void;
}

const SocketContext = createContext<SocketContextValue>({
    isConnected: false,
    on: () => () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { accessToken, user } = useAuth();
    const wsRef       = useRef<WebSocket | null>(null);
    const listeners   = useRef<Map<string, Set<EventHandler>>>(new Map());
    const reconnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const on = useCallback((event: string, handler: EventHandler) => {
        if (!listeners.current.has(event)) {
            listeners.current.set(event, new Set());
        }
        listeners.current.get(event)!.add(handler);
        // Return unsubscribe function
        return () => {
            listeners.current.get(event)?.delete(handler);
        };
    }, []);

    useEffect(() => {
        if (!accessToken || !user) {
            wsRef.current?.close();
            wsRef.current = null;
            setIsConnected(false);
            return;
        }

        let active = true;

        function connect() {
            if (!active || !accessToken) return;

            const ws = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(accessToken)}`);
            wsRef.current = ws;

            ws.onopen = () => {
                if (active) setIsConnected(true);
            };

            ws.onmessage = (e) => {
                try {
                    const { type, data } = JSON.parse(e.data as string);
                    listeners.current.get(type)?.forEach((h) => h(data));
                } catch { /* ignore malformed */ }
            };

            ws.onclose = () => {
                if (!active) return;
                setIsConnected(false);
                // Reconnect after 3s
                reconnTimer.current = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        }

        connect();

        return () => {
            active = false;
            if (reconnTimer.current) clearTimeout(reconnTimer.current);
            wsRef.current?.close();
            wsRef.current = null;
            setIsConnected(false);
        };
    }, [accessToken, user?.id]);

    return (
        <SocketContext.Provider value={{ isConnected, on }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
