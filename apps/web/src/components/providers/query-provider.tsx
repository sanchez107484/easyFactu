'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import type { AxiosError } from 'axios';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (before was cacheTime)
            refetchOnWindowFocus: false, // los hooks ya declaran staleTime adecuado, evita re-fetches al volver a la pesta\u00f1a
            retry: (failureCount, error) => {
              // No retry on 4xx errors
              const status = (error as AxiosError)?.response?.status;
              if (status !== undefined && status >= 400 && status < 500) {
                return false;
              }
              // Max 2 retries for 5xx errors
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
