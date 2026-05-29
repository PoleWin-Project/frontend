import Constants from 'expo-constants';

/**
 * Résolution automatique de l'URL du backend.
 *
 * Priorité :
 *  1. EXPO_PUBLIC_API_URL défini dans .env  → override manuel explicite
 *  2. IP LAN du serveur Expo détectée automatiquement (téléphone physique / émulateur
 *     sur le même réseau). Plus besoin de changer l'IP à la main quand on change de WiFi.
 *  3. localhost (front web ouvert sur la même machine que le backend)
 */
function detectExpoHost(): string | undefined {
    // hostUri ressemble à "192.168.1.13:8081" quand Expo tourne sur le réseau local.
    const hostUri =
        Constants.expoConfig?.hostUri ??
        (Constants as any).expoGoConfig?.debuggerHost ??
        (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
        (Constants as any).manifest?.debuggerHost;

    return hostUri?.split(':')[0];
}

function resolveApiUrl(): string {
    const fromEnv = process.env.EXPO_PUBLIC_API_URL;
    if (fromEnv && fromEnv.trim()) return fromEnv.trim();

    const host = detectExpoHost();
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:8000/api/v1`;
    }

    return 'http://localhost:8000/api/v1';
}

/** Base de l'API REST, ex: http://192.168.1.13:8000/api/v1 */
export const API_URL = resolveApiUrl();

/** Racine du serveur sans /api/v1, ex: http://192.168.1.13:8000 (images, assets…) */
export const API_ROOT = API_URL.replace(/\/api\/v1\/?$/, '');

/** Base WebSocket dérivée de l'API, ex: ws://192.168.1.13:8000 */
export const WS_BASE = API_ROOT.replace(/^http/, 'ws');
