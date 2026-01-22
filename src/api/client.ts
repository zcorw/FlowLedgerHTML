import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const TOKEN_KEY = 'flow-ledger_access_token';

export const tokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

// Inject token into request headers.
http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Return data directly; propagate errors to callers.
http.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError<{ error?: { code?: string; message?: string }, detail?: string }>) => {
    const status = error.response?.status;
    const code = error.response?.data?.detail;
    console.log(status, error.response);
    if (
      status === 401 &&
      (code === 'invalid_token_signature' || code === 'token_expired' || code === 'unauthorized')
    ) {
      tokenStorage.clear();
      if (typeof window !== 'undefined') {
        const { pathname } = window.location;
        if (pathname !== '/login' && pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export type RequestConfig<T = unknown> = AxiosRequestConfig<T>;

export function request<T = unknown>(config: RequestConfig) {
  return http.request<T>(config) as unknown as Promise<T>;
}

export function get<T = unknown>(url: string, config?: RequestConfig) {
  return request<T>({ ...config, method: 'GET', url });
}

export function post<T = unknown>(url: string, data?: unknown, config?: RequestConfig) {
  return request<T>({ ...config, method: 'POST', url, data });
}

export function put<T = unknown>(url: string, data?: unknown, config?: RequestConfig) {
  return request<T>({ ...config, method: 'PUT', url, data });
}

export function del<T = unknown>(url: string, config?: RequestConfig) {
  return request<T>({ ...config, method: 'DELETE', url });
}

export function patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig) {
  return request<T>({ ...config, method: 'PATCH', url, data });
}

export default http;
