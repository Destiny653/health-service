"use client";

import apiClient from "@/lib/axios";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosRequestConfig } from "axios";

/**
 * Reusable hook for POST, PUT, DELETE requests
 *
 * @param method - HTTP method ("post", "put", "delete")
 * @param endpoint - API endpoint
 * @param options - React Query mutation options
 */
export function useMutationRequest<T, D = unknown>(
  method: "post" | "put" | "delete",
  endpoint: string,
  options?: Omit<UseMutationOptions<T, unknown, D>, "mutationFn">
) {
  return useMutation<T, unknown, D>({
    mutationFn: async (data: D) => {
      const response =
        method === "post"
          ? await apiClient.post<T>(endpoint, data)
          : method === "put"
          ? await apiClient.put<T>(endpoint, data)
          : await apiClient.delete<T>(endpoint, { data });
      return response.data;
    },
    ...options,
  });
}
