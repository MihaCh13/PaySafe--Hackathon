import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 1;
      },
      staleTime: 5 * 60 * 1000,
    },
  },
});
