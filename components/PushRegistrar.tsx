import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { registerPushToken } from '@/lib/api/push';

// Affichage des notifications reçues alors que l'app est au premier plan.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

function projectId(): string | undefined {
    return (
        Constants.expoConfig?.extra?.eas?.projectId ??
        (Constants as any).easConfig?.projectId
    );
}

async function getExpoPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
        // Le push distant ne fonctionne pas sur simulateur/émulateur.
        console.log('[push] appareil non physique — token push ignoré');
        return null;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        status = req.status;
    }
    if (status !== 'granted') {
        console.log('[push] permission refusée');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Général',
            importance: Notifications.AndroidImportance.DEFAULT,
            lightColor: '#E10600',
        });
    }

    try {
        const id = projectId();
        const tokenData = await Notifications.getExpoPushTokenAsync(id ? { projectId: id } : undefined);
        return tokenData.data;
    } catch (e) {
        console.warn('[push] getExpoPushTokenAsync a échoué:', e);
        return null;
    }
}

/** Route l'utilisateur selon le contenu de la notification touchée. */
function routeFromData(router: ReturnType<typeof useRouter>, data: any) {
    if (!data || typeof data !== 'object') return;
    switch (data.type) {
        case 'dm':
            if (data.userId) router.push(`/messages/${data.userId}`);
            break;
        case 'friend':
            if (data.userId) router.push(`/user/${data.userId}`);
            break;
        case 'prono':
        case 'session':
            router.push('/(tabs)/pronostics');
            break;
        case 'badge':
            router.push('/(tabs)/profile');
            break;
    }
}

/**
 * Enregistre le token push de l'appareil dès que l'utilisateur est connecté,
 * et gère la navigation quand une notification est touchée.
 * À monter une seule fois, sous AuthProvider.
 */
export function PushRegistrar() {
    const { user } = useAuth();
    const router = useRouter();
    const registeredFor = useRef<number | null>(null);

    // Enregistrement du token à la connexion.
    useEffect(() => {
        if (!user) {
            registeredFor.current = null;
            return;
        }
        if (registeredFor.current === user.id) return;

        let cancelled = false;
        (async () => {
            const token = await getExpoPushToken();
            if (cancelled || !token) return;
            const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
            const ok = await registerPushToken(token, platform);
            if (ok && !cancelled) registeredFor.current = user.id;
        })();

        return () => { cancelled = true; };
    }, [user?.id]);

    // Tap sur une notification (app en arrière-plan ou fermée).
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            routeFromData(router, response.notification.request.content.data);
        });
        // Cas où l'app a été ouverte depuis une notif (cold start).
        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (response) routeFromData(router, response.notification.request.content.data);
        });
        return () => sub.remove();
    }, [router]);

    return null;
}
