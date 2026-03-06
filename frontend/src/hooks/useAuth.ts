import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import type { AuthState } from "../types";

export function useAuth(): AuthState & { logout: () => Promise<void>; refresh: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    user: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const data = await api.getMe();
      setState({ authenticated: true, user: data.user, loading: false });
    } catch {
      setState({ authenticated: false, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setState({ authenticated: false, user: null, loading: false });
    }
  }, []);

  return { ...state, logout, refresh };
}
