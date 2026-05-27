import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import type { AuthUser } from '@/lib/api/auth';
import { login as apiLogin, refreshTokens, register as apiRegister, fetchCurrentUser, loginWithGoogle as apiLoginWithGoogle, loginWithApple as apiLoginWithApple } from '@/lib/api/auth';
import { updateUserProfile as apiUpdateUserProfile, type UpdateProfileInput } from '@/lib/api/users';

const ACCESS_TOKEN_KEY = '@polewin/accessToken';
const REFRESH_TOKEN_KEY = '@polewin/refreshToken';
const USER_KEY = '@polewin/user';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (input: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithApple: (identityToken: string, email?: string, fullName?: { givenName?: string | null; familyName?: string | null }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (data: UpdateProfileInput) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    accessToken: null,
    isInitialized: false,
    isLoading: false,
    error: null,
  });

  const loadStoredSession = React.useCallback(async () => {
    try {
      const [storedAccess, storedRefresh, storedUser] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedRefresh) {
        const result = await refreshTokens(storedRefresh);
        if (result.ok) {
          const userJson = storedUser ? JSON.parse(storedUser) : null;
          await Promise.all([
            AsyncStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken),
            AsyncStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken),
          ]);
          setState({
            user: userJson,
            accessToken: result.accessToken,
            isInitialized: true,
            isLoading: false,
            error: null,
          });
          return;
        }
      }

      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      setState((s) => ({ ...s, user: null, accessToken: null, isInitialized: true, isLoading: false }));
    } catch {
      setState((s) => ({ ...s, isInitialized: true, isLoading: false }));
    }
  }, []);

  React.useEffect(() => {
    loadStoredSession();
  }, [loadStoredSession]);

  const login = React.useCallback(
    async (identifier: string, password: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      const result = await apiLogin(identifier, password);
      if (!result.ok) {
        setState((s) => ({ ...s, isLoading: false, error: result.error }));
        return { ok: false, error: result.error };
      }
      await Promise.all([
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, result.data.accessToken),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(result.data.user)),
      ]);
      setState({
        user: result.data.user,
        accessToken: result.data.accessToken,
        isInitialized: true,
        isLoading: false,
        error: null,
      });
      return { ok: true };
    },
    []
  );

  const register = React.useCallback(
    async (input: { email: string; username: string; password: string; confirmPassword: string }) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      const result = await apiRegister(input);
      if (!result.ok) {
        setState((s) => ({ ...s, isLoading: false, error: result.error }));
        return { ok: false, error: result.error };
      }
      await Promise.all([
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, result.data.accessToken),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(result.data.user)),
      ]);
      setState({
        user: result.data.user,
        accessToken: result.data.accessToken,
        isInitialized: true,
        isLoading: false,
        error: null,
      });
      return { ok: true };
    },
    []
  );

  const loginWithGoogle = React.useCallback(async (idToken: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    const result = await apiLoginWithGoogle(idToken);
    if (!result.ok) {
      setState((s) => ({ ...s, isLoading: false, error: result.error }));
      return { ok: false, error: result.error };
    }
    await Promise.all([
      AsyncStorage.setItem(ACCESS_TOKEN_KEY, result.data.accessToken),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(result.data.user)),
    ]);
    setState({
      user: result.data.user,
      accessToken: result.data.accessToken,
      isInitialized: true,
      isLoading: false,
      error: null,
    });
    return { ok: true };
  }, []);

  const loginWithApple = React.useCallback(async (identityToken: string, email?: string, fullName?: any) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    const result = await apiLoginWithApple(identityToken, email, fullName);
    if (!result.ok) {
      setState((s) => ({ ...s, isLoading: false, error: result.error }));
      return { ok: false, error: result.error };
    }
    await Promise.all([
      AsyncStorage.setItem(ACCESS_TOKEN_KEY, result.data.accessToken),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(result.data.user)),
    ]);
    setState({
      user: result.data.user,
      accessToken: result.data.accessToken,
      isInitialized: true,
      isLoading: false,
      error: null,
    });
    return { ok: true };
  }, []);

  const logout = React.useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setState({
      user: null,
      accessToken: null,
      isInitialized: true,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = React.useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const updateUserProfile = React.useCallback(
    async (data: UpdateProfileInput) => {
      if (!state.accessToken) return { ok: false, error: 'Non authentiqué' };
      setState((s) => ({ ...s, isLoading: true, error: null }));
      
      const result = await apiUpdateUserProfile(data, state.accessToken);
      if (!result.ok) {
        setState((s) => ({ ...s, isLoading: false, error: result.error }));
        return { ok: false, error: result.error };
      }
      
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
      setState((s) => ({
        ...s,
        user: result.user,
        isLoading: false,
        error: null,
      }));
      return { ok: true };
    },
    [state.accessToken]
  );

  const refreshProfile = React.useCallback(async () => {
    if (!state.accessToken) return;
    const result = await fetchCurrentUser(state.accessToken);
    if (result.ok) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
      setState((s) => ({ ...s, user: result.user }));
    }
  }, [state.accessToken]);

  const deleteAccount = React.useCallback(async () => {
    if (!state.accessToken) return { ok: false, error: 'Non authentiqué' };
    setState((s) => ({ ...s, isLoading: true, error: null }));
    
    const { deleteUserAccount } = await import('@/lib/api/users');
    const result = await deleteUserAccount(state.accessToken);
    
    if (!result.ok) {
      setState((s) => ({ ...s, isLoading: false, error: result.error }));
      return { ok: false, error: result.error };
    }
    
    await logout();
    return { ok: true };
  }, [state.accessToken, logout]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    loginWithGoogle,
    loginWithApple,
    logout,
    clearError,
    refreshProfile,
    updateUserProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
