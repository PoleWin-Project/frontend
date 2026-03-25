import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import type { AuthUser } from '@/lib/api/auth';
import { login as apiLogin, refreshTokens, register as apiRegister } from '@/lib/api/auth';

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
  logout: () => Promise<void>;
  clearError: () => void;
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

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
