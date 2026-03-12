const API_BASE = "/api/admin";

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

export interface ReportCardListResponse {
  items: {
    session: import("../types").SessionDetail;
    user: import("../types").User | null;
  }[];
  total: number;
  page: number;
  pages: number;
}

export interface MicrosoftConfig {
  client_id: string;
  tenant_id: string;
  has_secret: boolean;
  is_configured: boolean;
}

export interface OneDriveFolder {
  id: number;
  folder_id: string;
  folder_path: string;
  persona: string | null;
  sync_status: string;
  last_synced_at: string | null;
  created_at: string | null;
}

export interface PersonaDetail {
  id: number;
  name: string;
  version: number;
  title: string;
  description: string;
  traits: string[];
  system_prompt: string;
  is_active: boolean;
  created_at: string | null;
}

export interface PersonaCreateUpdate {
  name?: string;
  title?: string;
  description?: string;
  traits?: string[];
  system_prompt?: string;
}

export const adminApi = {
  login: (password: string) =>
    request<{ authenticated: boolean }>("/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  logout: () => request<{ message: string }>("/logout", { method: "POST" }),

  getMe: () => request<{ authenticated: boolean }>("/me"),

  getUsers: () => request<import("../types").User[]>("/users"),

  getReportCards: (params?: { page?: number; per_page?: number; user_id?: number; persona?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.per_page) searchParams.set("per_page", String(params.per_page));
    if (params?.user_id) searchParams.set("user_id", String(params.user_id));
    if (params?.persona) searchParams.set("persona", String(params.persona));
    const qs = searchParams.toString();
    return request<ReportCardListResponse>(`/report-cards${qs ? `?${qs}` : ""}`);
  },

  getReportCard: (id: number) =>
    request<{ session: import("../types").SessionDetail; user: import("../types").User | null }>(
      `/report-cards/${id}`,
    ),

  getMicrosoftConfig: () => request<MicrosoftConfig>("/config/microsoft"),

  saveMicrosoftConfig: (config: { client_id?: string; tenant_id?: string; client_secret?: string }) =>
    request<{ message: string }>("/config/microsoft", {
      method: "PUT",
      body: JSON.stringify(config),
    }),

  getOneDriveFolders: () => request<OneDriveFolder[]>("/onedrive/folders"),

  addOneDriveFolder: (data: { folder_path: string; folder_id?: string; persona?: string }) =>
    request<OneDriveFolder>("/onedrive/folders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteOneDriveFolder: (id: number) =>
    request<{ message: string }>(`/onedrive/folders/${id}`, { method: "DELETE" }),

  syncOneDriveFolder: (id: number) =>
    request<{ message: string; folder: OneDriveFolder }>(`/onedrive/folders/${id}/sync`, { method: "POST" }),

  getOneDriveConnectUrl: () => request<{ auth_url: string }>("/onedrive/connect"),

  // Personas
  getPersonas: () => request<PersonaDetail[]>("/personas"),

  getPersona: (name: string) => request<PersonaDetail>(`/personas/${name}`),

  getPersonaVersions: (name: string) => request<PersonaDetail[]>(`/personas/${name}/versions`),

  createPersona: (data: PersonaCreateUpdate) =>
    request<PersonaDetail>("/personas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePersona: (name: string, data: PersonaCreateUpdate) =>
    request<PersonaDetail>(`/personas/${name}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deactivatePersona: (name: string) =>
    request<{ message: string }>(`/personas/${name}`, { method: "DELETE" }),
};
