export * from "./database";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** App with Date fields serialized to strings for client components */
export interface SerializedApp {
  id: string;
  name: string;
  submissionType: string;
  platform: string | null;
  playUrl: string | null;
  testUrl: string | null;
  description: string | null;
  iconUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  testerCount?: number;
}
