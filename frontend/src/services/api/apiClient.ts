/**
 * apiClient.ts
 * Centralized fetch-based API client for PlotFarm frontend.
 * Automatically attaches JWT bearer token and handles standard response envelope.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
const TOKEN_KEY = 'accessToken';

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta: unknown;
}

export class ApiError extends Error {
  status: number;
  errors: unknown;
  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đang chạy.',
      0,
    );
  }

  // Handle 401 — token expired / unauthorized
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('authUser');
    window.location.href = '/login';
    throw new ApiError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 401);
  }

  let json: ApiEnvelope<T>;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(`Lỗi phản hồi từ máy chủ (${response.status})`, response.status);
  }

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.message || `Lỗi ${response.status}`,
      response.status,
      (json as unknown as { errors?: unknown }).errors,
    );
  }

  return json.data;
}

const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export default apiClient;
