import { apiClient, buildQueryString } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  Expense,
  PaginatedResponse,
  QueryExpensesInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseSummary,
} from '@easyfactura/shared-types';

export const expenseApi = {
  getAll: (filters: QueryExpensesInput = {}): Promise<PaginatedResponse<Expense>> =>
    apiClient
      .get<ApiResponse<PaginatedResponse<Expense>>>(`/expenses${buildQueryString(filters as Record<string, unknown>)}`)
      .then(unwrapApiResponse),

  getById: (id: string): Promise<Expense> =>
    apiClient.get<ApiResponse<Expense>>(`/expenses/${id}`).then(unwrapApiResponse),

  create: (data: CreateExpenseInput): Promise<Expense> =>
    apiClient.post<ApiResponse<Expense>>('/expenses', data).then(unwrapApiResponse),

  update: (id: string, data: UpdateExpenseInput): Promise<Expense> =>
    apiClient.put<ApiResponse<Expense>>(`/expenses/${id}`, data).then(unwrapApiResponse),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/expenses/${id}`).then(() => undefined),

  getSummary: (): Promise<ExpenseSummary> =>
    apiClient.get<ApiResponse<ExpenseSummary>>('/expenses/summary').then(unwrapApiResponse),
};
