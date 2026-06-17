import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '@/lib/config';

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('@polewin/accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export async function registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/push/tokens`, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify({ token, platform }),
        });
        return res.ok;
    } catch (e) {
        console.warn('registerPushToken failed:', e);
        return false;
    }
}

export async function unregisterPushToken(token: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/push/tokens`, {
            method: 'DELETE',
            headers: await getHeaders(),
            body: JSON.stringify({ token }),
        });
        return res.ok;
    } catch (e) {
        console.warn('unregisterPushToken failed:', e);
        return false;
    }
}
