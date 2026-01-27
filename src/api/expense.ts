import { del, get, patch, post } from './client';

export type Expense = {
  id: number;
  amount: string; // decimal string, up to 6 decimals
  currency: string; // ISO 4217 code
  category_id: number | null;
  merchant: string | null;
  paid_account_id: number | null;
  occurred_at: string; // ISO date-time
  source_ref: string | null;
  note: string | null;
};

export type ExpenseCreate = Omit<Expense, 'id'>;

export type ExpensePatch = Partial<ExpenseCreate>;

export type ExpenseList = {
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  data: Expense[];
};

export type Category = {
  id: number;
  name: string;
};

export type CategoryCreate = Omit<Category, 'id'>;

export type CategoryList = {
  data: Category[];
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

export type ListExpensesParams = PaginationParams & {
  from?: string; // ISO date-time
  to?: string; // ISO date-time
};

/**
 * Create expense.
 * POST /expenses
 * Request: ExpenseCreate
 * Response: Expense
 */
export async function createExpense(payload: ExpenseCreate, idempotencyKey?: string) {
  return post<Expense>('/expenses', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

/**
 * List expenses with pagination and time range filters.
 * GET /expenses
 * Response: ExpenseList
 */
export async function listExpenses(params?: ListExpensesParams) {
  return get<ExpenseList>('/expenses', { params });
}

/**
 * Get expense by id.
 * GET /expenses/{expense_id}
 * Response: Expense
 */
export async function getExpense(expenseId: number) {
  return get<Expense>(`/expenses/${expenseId}`);
}

/**
 * Update expense by id.
 * PATCH /expenses/{expense_id}
 * Request: ExpensePatch
 * Response: Expense
 */
export async function updateExpense(expenseId: number, payload: ExpensePatch) {
  return patch<Expense>(`/expenses/${expenseId}`, payload);
}

/**
 * Delete expense by id.
 * DELETE /expenses/{expense_id}
 * Response: Expense
 */
export async function deleteExpense(expenseId: number) {
  return del<Expense>(`/expenses/${expenseId}`);
}

/**
 * List categories.
 * GET /categories
 * Response: CategoryList
 */
export async function listCategories() {
  return get<CategoryList>('/categories');
}

/**
 * Create category.
 * POST /categories
 * Request: CategoryCreate
 * Response: Category
 */
export async function createCategory(payload: CategoryCreate, idempotencyKey?: string) {
  return post<Category>('/categories', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}
