import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  Subscription,
  Plan,
} from '@easyfactura/shared-types';

export const subscriptionApi = {
  getCurrent: (): Promise<Subscription> =>
    apiClient.get<ApiResponse<Subscription>>('/subscriptions').then(unwrapApiResponse),

  getAvailablePlans: (): Promise<Plan[]> =>
    apiClient.get<ApiResponse<Plan[]>>('/subscriptions/plans').then(unwrapApiResponse),

  getUsage: (): Promise<{ invoicesThisYear: number; maxInvoicesBasic: number | null }> =>
    apiClient
      .get<ApiResponse<{ invoicesThisYear: number; maxInvoicesBasic: number | null }>>(
        '/subscriptions/usage'
      )
      .then(unwrapApiResponse),

  changePlan: (targetPlanSlug: string): Promise<{ success: boolean; message: string }> =>
    apiClient
      .post<ApiResponse<{ success: boolean; message: string }>>('/subscriptions/change-plan', {
        targetPlanSlug,
      })
      .then(unwrapApiResponse),
};
