import { create } from 'zustand';
import {
  Currency,
  CurrencyPage,
  ListCurrenciesParams,
  listCurrencies,
} from '../api/currency';
import useAuthStore, { selectIsAuthenticated } from './auth';

type CurrencyState = {
  currencies: Currency[];
  currencyMap: Record<string, Currency>;
  loading: boolean;
  initialized: boolean; // whether we've attempted fetch
  error: string | null;
  fetchCurrencies: (force?: boolean) => Promise<void>;
  getCurrency: (code: string) => Currency | undefined;
  clear: () => void;
};

const PAGE_SIZE = 200; // max per spec

const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currencies: [],
  currencyMap: {},
  loading: false,
  initialized: false,
  error: null,
  /**
   * 拉取全部货币数据（会自动分页）。未登录时不会发起请求。
   */
  fetchCurrencies: async (force = false) => {
    const isAuthenticated = selectIsAuthenticated(useAuthStore.getState());
    const { loading, initialized } = get();
    if (!isAuthenticated) return;
    if (loading) return;
    if (initialized && !force) return;

    set({ loading: true, error: null });
    try {
      let page = 1;
      const items: Currency[] = [];
      // 拉取所有分页
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res: CurrencyPage = await listCurrencies({
          page,
          page_size: PAGE_SIZE,
        } satisfies ListCurrenciesParams);
        items.push(...res.items);
        if (!res.has_next) break;
        page += 1;
      }
      const map = items.reduce<Record<string, Currency>>((acc, item) => {
        acc[item.code] = item;
        return acc;
      }, {});
      set({ currencies: items, currencyMap: map, loading: false, initialized: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ loading: false, initialized: true, error: message });
    }
  },
  getCurrency: (code: string) => get().currencyMap[code],
  clear: () => set({ currencies: [], currencyMap: {}, loading: false, error: null, initialized: false }),
}));

// 自动根据登录状态拉取/清空货币数据
const initialAuth = selectIsAuthenticated(useAuthStore.getState());
if (initialAuth) {
  void useCurrencyStore.getState().fetchCurrencies();
}

useAuthStore.subscribe((state, prev) => {
  const store = useCurrencyStore.getState();
  const isAuthed = selectIsAuthenticated(state);
  const wasAuthed = selectIsAuthenticated(prev);
  if (isAuthed && !wasAuthed) {
    void store.fetchCurrencies(true);
  }
  if (!isAuthed && wasAuthed) {
    store.clear();
  }
});

export const selectCurrencies = (s: CurrencyState) => s.currencies;
export const selectCurrencyMap = (s: CurrencyState) => s.currencyMap;
export const selectCurrencyLoading = (s: CurrencyState) => s.loading;
export const selectCurrencyError = (s: CurrencyState) => s.error;

export default useCurrencyStore;
