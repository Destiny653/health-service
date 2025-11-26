"use client";

import apiClient from "@/lib/axios";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

/**
 * Reusable hook for fetching data from an API endpoint (GET only)
 *
 * @param queryKey - Unique query key for React Query caching
 * @param endpoint - API endpoint (e.g., "/patients")
 * @param config - Optional request config
 * @param options - Optional React Query options
 */
export function useFetch<T>(
  queryKey: string | readonly unknown[],
  endpoint: string,
  config?: RequestInit,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
) {
  return useQuery<T>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const data = await apiClient.get<T>(endpoint, config);
      return data;
    },
    ...options,
  });
}
