import { API_URL } from '@/lib/config';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  roles: string[];
  isEmailVerified?: boolean;
  points: number;
  profile?: {
    favoriteTeamCode?: string | null;
    favoriteDriverCode?: string | null;
    bio?: string | null;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginResponse {
  status: 'error';
  message: string;
}
export interface LoginSuccessResponse extends AuthTokens {
  _links?: Record<string, unknown>;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
  country?: string;
  language?: string;
}

export interface RegisterSuccessResponse extends AuthTokens {
  verifyEmailToken?: string;
  _links?: Record<string, unknown>;
}

/**
 * Connexion: identifier = email ou username
 */
export async function login(
  identifier: string,
  password: string
): Promise<{ ok: true; data: AuthTokens } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      const backendMessage = typeof data?.message === 'string' ? data.message.toLowerCase() : '';

      if (res.status === 401 || backendMessage.includes('invalid credentials')) {
        return { ok: false, error: 'Email/pseudo ou mot de passe incorrect.' };
      }
      if (res.status === 429) {
        return { ok: false, error: 'Trop de tentatives. Reessaie dans quelques minutes.' };
      }
      if (res.status >= 500) {
        return { ok: false, error: 'Serveur indisponible. Reessaie plus tard.' };
      }
      return { ok: false, error: 'Connexion impossible. Verifie tes informations puis reessaie.' };
    }

    if (data.status === 'error') {
      const backendMessage = typeof data?.message === 'string' ? data.message.toLowerCase() : '';
      if (backendMessage.includes('invalid credentials')) {
        return { ok: false, error: 'Email/pseudo ou mot de passe incorrect.' };
      }
      return { ok: false, error: 'Connexion impossible. Reessaie.' };
    }

    return {
      ok: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      },
    };
  } catch (e: unknown) {
    const raw = e instanceof Error ? e.message.toLowerCase() : '';
    if (raw.includes('network request failed') || raw.includes('failed to fetch')) {
      return { ok: false, error: "Erreur reseau. Verifie le Wi-Fi et l'adresse de l'API." };
    }
    return { ok: false, error: 'Une erreur inattendue est survenue pendant la connexion.' };
  }
}

/**
 * Connexion avec Google
 */
export async function loginWithGoogle(
  idToken: string
): Promise<{ ok: true; data: AuthTokens } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.message || 'Echec de la connexion Google.' };
    }

    return {
      ok: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      },
    };
  } catch (e) {
    return { ok: false, error: 'Erreur réseau.' };
  }
}

/**
 * Connexion avec Apple
 */
export async function loginWithApple(
  identityToken: string,
  email?: string,
  fullName?: { givenName?: string | null; familyName?: string | null }
): Promise<{ ok: true; data: AuthTokens } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/apple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityToken, email, fullName }),
    });
    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.message || 'Echec de la connexion Apple.' };
    }

    return {
      ok: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      },
    };
  } catch (e) {
    return { ok: false, error: 'Erreur réseau.' };
  }
}

/**
 * Inscription
 */
export async function register(
  input: RegisterInput
): Promise<{ ok: true; data: AuthTokens } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.message || 'Inscription impossible' };
    }
    if (data.status === 'error') {
      return { ok: false, error: data.message || 'Inscription impossible' };
    }

    return {
      ok: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      },
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur reseau';
    return { ok: false, error: msg };
  }
}

/**
 * Rafraichir les tokens (access + refresh)
 */
export async function refreshTokens(
  refreshToken: string
): Promise<{ ok: true; accessToken: string; refreshToken: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.message || 'Session expiree' };
    }
    if (data.status === 'error') {
      return { ok: false, error: data.message || 'Session expiree' };
    }

    return {
      ok: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur reseau';
    return { ok: false, error: msg };
  }
}

export async function fetchCurrentUser(accessToken: string): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    });
    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.message || 'Impossible de recuperer le profil' };
    }

    return {
      ok: true,
      user: data.user,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur reseau';
    return { ok: false, error: msg };
  }
}

export async function forgotPassword(email: string): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.message || 'Impossible de faire la demande' };
    }
    return { ok: true, message: data.message || 'Email envoyé' };
  } catch (e: unknown) {
    return { ok: false, error: 'Erreur réseau' };
  }
}

export async function resetPassword(token: string, newPassword: string, confirmNewPassword: string): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword, confirmNewPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.message || 'Impossible de réinitialiser le mot de passe' };
    }
    return { ok: true, message: data.message || 'Mot de passe réinitialisé' };
  } catch (e: unknown) {
    return { ok: false, error: 'Erreur réseau' };
  }
}
