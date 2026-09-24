import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import { ActivitySummary } from '@easyfactura/shared-types';

export const activityApi = {
  getSummary: (): Promise<ActivitySummary> =>
    apiClient.get<ApiResponse<ActivitySummary>>('/activity-summary').then(unwrapApiResponse),
};
