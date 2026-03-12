import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../services/adminApi";

interface AdminState {
  authenticated: boolean;
  loading: boolean;
}

export function useAdmin(): AdminState & { login: (password: string) => Promise<void>; logout: () => Promise<void> } {
  const [state, setState] = useState<AdminState>({ authenticated: false, loading: true });

  useEffect(() => {
    adminApi
      .getMe()
      .then(() => setState({ authenticated: true, loading: false }))
      .catch(() => setState({ authenticated: false, loading: false }));
  }, []);

  const login = useCallback(async (password: string) => {
    await adminApi.login(password);
    setState({ authenticated: true, loading: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setState({ authenticated: false, loading: false });
    }
  }, []);

  return { ...state, login, logout };
}
