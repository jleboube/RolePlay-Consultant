const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getMe: () => request<{ authenticated: boolean; user: import("../types").User }>("/auth/me"),

  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),

  getPersonas: () => request<import("../types").Persona[]>("/personas"),

  getSessions: () => request<import("../types").SessionSummary[]>("/sessions"),

  getSession: (id: number) => request<import("../types").SessionDetail>(`/sessions/${id}`),
};
