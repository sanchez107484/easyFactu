'use client';

import { useQuery } from '@tanstack/react-query';
import { expenseCategoryApi } from '@/lib/api/expense-category-api';

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories', 'list'],
    queryFn: () => expenseCategoryApi.getAll(),
    staleTime: 5 * 60 * 1000, // Categories rarely change
  });
}
