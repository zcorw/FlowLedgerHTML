import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tokenStorage } from '../api/client';

// 鉴权状态结构
type AuthState = {
  token: string | null; // access_token
  user: Record<string, unknown> | null; // 当前用户信息
  preferences: Record<string, unknown> | null; // 用户偏好
  expiresAt: number | null; // 过期时间戳 (ms)
  setSession: (params: {
    token: string;
    user: Record<string, unknown>;
    preferences?: Record<string, unknown> | null;
    expiresInSeconds?: number;
  }) => void;
  clearSession: () => void;
};

const useAuthStore = create<AuthState>()(
  persist(
    // 状态定义与写入逻辑
    (set) => ({
      token: null,
      user: null,
      preferences: null,
      expiresAt: null,
      setSession: ({ token, user, preferences = null, expiresInSeconds }) =>
        set(() => {
          // 同步 axios token 存储，便于拦截器读取
          tokenStorage.set(token);
          return {
            token,
            user,
            preferences,
            expiresAt: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : null,
          };
        }),
      clearSession: () =>
        set(() => {
          // 登出时清空本地持久化
          tokenStorage.clear();
          return { token: null, user: null, preferences: null, expiresAt: null };
        }),
    }),
    {
      // 持久化到 localStorage 的键名
      name: 'flow-ledger_auth',
      // 仅持久化部分字段
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        preferences: state.preferences,
        expiresAt: state.expiresAt,
      }),
      // 恢复时若有 token，再同步给 axios 存储
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          tokenStorage.set(state.token);
        }
      },
    }
  )
);

export const selectIsAuthenticated = (s: AuthState) => Boolean(s.token); // 是否已登录
export const selectUser = (s: AuthState) => s.user; // 当前用户
export const selectPreferences = (s: AuthState) => s.preferences; // 当前偏好


export const formatAmount = (amount: number, preferences: Record<string, unknown> | null) => {
  const currency = preferences?.base_currency as string | undefined;
  const language = preferences?.language as string | undefined;
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}; // 按当前偏好的货币单位格式化金额

// 账号初始化后请求
export async function fetchInitIsAuthenticated(fetchInit: (force?: boolean) => Promise<void>, clear: () => void) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  if (isAuthenticated) {
    await fetchInit();
  }
  useAuthStore.subscribe((state, prev) => {
    const isAuthed = selectIsAuthenticated(state);
    const wasAuthed = selectIsAuthenticated(prev);
    if (isAuthed && !wasAuthed) {
      void fetchInit(true);
    }
    if (!isAuthed && wasAuthed) {
      clear();
    }
  });
}
export default useAuthStore;
