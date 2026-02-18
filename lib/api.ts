import type { App, User } from "@/types/database";
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

// --- Public ---

export async function getApps(params?: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return fetchApi<PaginatedResponse<App>>(`/apps${query}`);
}

export async function submitApp(data: {
  submission_type: "live" | "test";
  platform: "android" | "ios";
  name: string;
  test_url: string;
  icon_url: string;
}) {
  return fetchApi<App>("/apps/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Auth ---

export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
}) {
  return fetchApi<{ id: string; email: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return fetchApi<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Admin Apps ---

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
    submissionType?: "live" | "test";
    platform?: "android" | "ios" | null;
    name?: string;
    playUrl?: string | null;
    description?: string | null;
    iconUrl?: string | null;
    startDate?: string | null;
    endDate?: string | null;
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

// --- Admin Users ---

export async function getAdminUsers(params?: { page?: number; limit?: number; role?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.role) searchParams.set("role", params.role);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return fetchApi<PaginatedResponse<Omit<User, "password">> & { currentRole: string }>(`/admin/users${query}`);
}

export async function createAdminUser(data: {
  email: string;
  password: string;
  role?: string;
  name?: string;
}) {
  return fetchApi<Omit<User, "password">>("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminUser(id: string) {
  return fetchApi<void>(`/admin/users?id=${id}`, {
    method: "DELETE",
  });
}

// --- User ---

export async function getUserApps() {
  return fetchApi<UserOwnedApp[]>("/user/apps");
}

export async function getUserTestRequests() {
  return fetchApi<Array<{ id: string; appId: string; createdAt: string; app: App }>>("/user/test-requests");
}

export interface TesterApplicant {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface UserOwnedApp extends App {
  testRequests?: TesterApplicant[];
}

export async function updateUserApp(
  id: string,
  updates: {
    name?: string;
    submissionType?: "live" | "test";
    platform?: "android" | "ios" | null;
    playUrl?: string | null;
    testUrl?: string | null;
    description?: string | null;
    iconUrl?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }
) {
  return fetchApi<UserOwnedApp>("/user/apps", {
    method: "PATCH",
    body: JSON.stringify({ id, ...updates }),
  });
}

export async function registerAsTester(appId: string) {
  return fetchApi<{ id: string }>(`/apps/${appId}/test`, {
    method: "POST",
  });
}

export async function unregisterAsTester(appId: string) {
  return fetchApi<void>(`/apps/${appId}/test`, {
    method: "DELETE",
  });
}

export async function updateProfile(data: { name?: string }) {
  return fetchApi<Omit<User, "password">>("/user/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
