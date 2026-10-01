import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import { ExpenseCategory } from '@easyfactura/shared-types';

export const expenseCategoryApi = {
  getAll: (): Promise<ExpenseCategory[]> =>
    apiClient.get<ApiResponse<ExpenseCategory[]>>('/expense-categories').then(unwrapApiResponse),
};
