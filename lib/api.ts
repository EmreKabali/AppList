import type { App, AdminUser } from "@/types/database";
import type { ApiResponse, PaginatedResponse } from "@/types";

const API_BASE = "/api";

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  return response.json();
}

export async function getApps(params?: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return fetchApi<PaginatedResponse<App>>(`/apps${query}`);
}

export async function submitApp(data: {
  submission_type: "live" | "test";
  platform?: "android" | "ios";
  name: string;
  play_url?: string;
  description?: string;
  icon_url: string;
  start_date?: string;
  end_date?: string;
}) {
  return fetchApi<App>("/apps/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAdminApps(params?: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  submission_type?: "live" | "test";
  platform?: "android" | "ios";
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.status) searchParams.set("status", params.status);
  if (params?.q) searchParams.set("q", params.q);
  if (params?.submission_type) searchParams.set("submission_type", params.submission_type);
  if (params?.platform) searchParams.set("platform", params.platform);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return fetchApi<PaginatedResponse<App>>(`/admin/apps${query}`);
}

export async function updateAppStatus(id: string, status: string) {
  return fetchApi<App>("/admin/apps", {
    method: "PATCH",
    body: JSON.stringify({ id, status }),
  });
}

export async function updateAdminApp(
  id: string,
  updates: {
    submission_type?: "live" | "test";
    platform?: "android" | "ios" | null;
    name?: string;
    play_url?: string | null;
    description?: string | null;
    icon_url?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    status?: string;
  }
) {
  return fetchApi<App>("/admin/apps", {
    method: "PATCH",
    body: JSON.stringify({ id, ...updates }),
  });
}

export async function deleteAdminApp(id: string) {
  return fetchApi<void>(`/admin/apps?id=${id}`, {
    method: "DELETE",
  });
}

export async function getAdminUsers(params?: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return fetchApi<PaginatedResponse<Omit<AdminUser, "password_hash">> & { currentRole: "admin" | "super_admin" }>(`/admin/users${query}`);
}

export async function createAdminUser(data: {
  email: string;
  password: string;
  role?: string;
}) {
  return fetchApi<Omit<AdminUser, "password_hash">>("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminUser(id: string) {
  return fetchApi<void>(`/admin/users?id=${id}`, {
    method: "DELETE",
  });
}
