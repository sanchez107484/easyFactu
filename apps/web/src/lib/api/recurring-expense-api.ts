import {
  RecurringExpense,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
  QueryRecurringExpensesInput,
  GenerateRecurringExpensesInput,
  GenerateRecurringExpensesResult,
  PaginatedResponse,
} from '@easyfactura/shared-types';
import { apiClient, buildQueryString } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';

const BASE = '/recurring-expenses';

export const recurringExpenseApi = {
  getAll: (filters: QueryRecurringExpensesInput = {}): Promise<PaginatedResponse<RecurringExpense>> =>
    apiClient
      .get<ApiResponse<PaginatedResponse<RecurringExpense>>>(`${BASE}${buildQueryString(filters as Record<string, unknown>)}`)
      .then(unwrapApiResponse),

  getById: (id: string): Promise<RecurringExpense> =>
    apiClient.get<ApiResponse<RecurringExpense>>(`${BASE}/${id}`).then(unwrapApiResponse),

  create: (data: CreateRecurringExpenseInput): Promise<RecurringExpense> =>
    apiClient.post<ApiResponse<RecurringExpense>>(BASE, data).then(unwrapApiResponse),

  update: (id: string, data: UpdateRecurringExpenseInput): Promise<RecurringExpense> =>
    apiClient.put<ApiResponse<RecurringExpense>>(`${BASE}/${id}`, data).then(unwrapApiResponse),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),

  generate: (id: string, data: GenerateRecurringExpensesInput = {}): Promise<GenerateRecurringExpensesResult> =>
    apiClient.post<ApiResponse<GenerateRecurringExpensesResult>>(`${BASE}/${id}/generate`, data).then(unwrapApiResponse),
};
