import { create } from 'zustand';
import { listCategories, type Category } from '../api/expense';
import { setupAuthSubscription } from './storeUtils';

type CategoryState = {
  categories: Category[];
  categoryMap: Record<string, Category>;
  loading: boolean;
  initialized: boolean; // whether we've attempted fetch
  error: string | null;
  fetchCategories: (force?: boolean) => Promise<void>;
  getCategory: (code: string) => Category | undefined;
  clear: () => void;
}

const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  categoryMap: {},
  loading: false,
  initialized: false,
  error: null,
  fetchCategories: async (force = false) => {
    const { loading, initialized } = get();
    if (loading) return;
    if (initialized && !force) return;

    set({ loading: true, error: null });
    try {
      const { data: res } = await listCategories();
      const map = res.reduce<Record<string, Category>>((acc, item) => {
        acc[item.name] = item;
        return acc;
      }, {});
      set({ categories: res, categoryMap: map, loading: false, initialized: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ error: message, loading: false, initialized: true });
    }
  },
  getCategory: (code: string) => get().categoryMap[code],
  clear: () => set({ categories: [], categoryMap: {}, loading: false, error: null, initialized: false }),
}));

setupAuthSubscription({
  onAuthenticated: (force) => {
    void useCategoryStore.getState().fetchCategories(force);
  },
  onUnauthenticated: () => {
    useCategoryStore.getState().clear();
  },
});

export const selectCategories = (s: CategoryState) => s.categories;
export const selectCategoryMap = (s: CategoryState) => s.categoryMap;
export const selectCategoryLoading = (s: CategoryState) => s.loading;
export const selectCategoryError = (s: CategoryState) => s.error;

export default useCategoryStore;