import { useState, useCallback } from 'react';

export interface UseAPIOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  initialLoading?: boolean;
}

export interface UseAPIReturn<T, P extends any[]> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  execute: (...args: P) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for making API calls with loading, error, and data state management
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useAPI(
 *   async (userId: string) => {
 *     const response = await fetch(`/api/users/${userId}`);
 *     return response.json();
 *   },
 *   {
 *     onSuccess: (data) => console.log('Success:', data),
 *     onError: (error) => console.error('Error:', error)
 *   }
 * );
 *
 * // Execute the API call
 * execute('user-123');
 * ```
 */
export function useAPI<T, P extends any[] = []>(
  apiFunc: (...args: P) => Promise<T>,
  options: UseAPIOptions<T> = {}
): UseAPIReturn<T, P> {
  const { onSuccess, onError, initialLoading = false } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(initialLoading);

  const execute = useCallback(
    async (...args: P) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunc(...args);
        setData(result);
        onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred');
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [apiFunc, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, error, loading, execute, reset };
}
