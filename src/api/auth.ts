import { del, get, patch, post, tokenStorage } from './client';
import useAuthStore from '../store/auth';

export type AuthResponse = {
  access_token: string;
  expires_in: number; // seconds
  user: Record<string, unknown>;
  preferences?: Record<string, unknown>;
};

export type RegisterPayload = {
  username: string;
  password: string;
  email: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type UpdatePreferencesPayload = Partial<Record<string, unknown>>;

export type LinkTelegramPayload = {
  telegram_user_id: number;
  link_token?: string;
};

export async function register(payload: RegisterPayload) {
  const res = await post<AuthResponse>('/auth/register', payload);
  useAuthStore.getState().setSession({
    token: res.access_token,
    user: res.user,
    preferences: (res as any).preferences ?? null,
    expiresInSeconds: res.expires_in,
  });
  return res;
}

export async function login(payload: LoginPayload) {
  const res = await post<AuthResponse>('/auth/login', payload);
  useAuthStore.getState().setSession({
    token: res.access_token,
    user: res.user,
    preferences: (res as any).preferences ?? null,
    expiresInSeconds: res.expires_in,
  });
  return res;
}

export async function getMe() {
  return get<Record<string, unknown>>('/users/me');
}

export async function updatePreferences(payload: UpdatePreferencesPayload, idempotencyKey?: string) {
  return patch<Record<string, unknown>>('/users/me/preferences', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export function logout() {
  useAuthStore.getState().clearSession();
}
