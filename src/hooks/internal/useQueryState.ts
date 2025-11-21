import { useCallback, useMemo, useRef, useState } from 'react';
import type { QueryResult } from '../../types/query-result.type';

function createQueryResult<T>(isLoading: boolean, error: string | null, data: T | undefined): QueryResult<T> {
  if (isLoading) {
    return {
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      data: undefined,
    } as const;
  }

  if (error) {
    return {
      isLoading: false,
      isSuccess: false,
      isError: true,
      error,
      data: undefined,
    } as const;
  }

  return {
    isLoading: false,
    isSuccess: true,
    isError: false,
    error: null,
    data: data as T,
  } as const;
}

interface UseQueryStateOptions<T> {
  defaultValue?: T;
  initialLoading?: boolean;
}

interface UseQueryStateReturn<T> {
  data: T | undefined;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  executeFetch: (fetcher: () => Promise<T>, errorMessage?: string) => () => void;
  reset: () => void;
  result: QueryResult<T>;
}

export function useQueryState<T>(options: UseQueryStateOptions<T>): UseQueryStateReturn<T> {
  const { defaultValue, initialLoading = false } = options;
  const defaultValueRef = useRef(defaultValue);

  const [data, setData] = useState<T | undefined>(defaultValue !== undefined ? (defaultValue as T) : undefined);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const executeFetch = useCallback((fetcher: () => Promise<T>, errorMessage = 'Failed to fetch') => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : errorMessage;
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const reset = useCallback(() => {
    setData(defaultValueRef.current ?? defaultValueRef.current);
    setIsLoading(false);
    setError(null);
  }, []);

  const result = useMemo(() => createQueryResult(isLoading, error, data), [isLoading, error, data]);

  return {
    data,
    setData,
    isLoading,
    setIsLoading,
    error,
    setError,
    executeFetch,
    reset,
    result,
  };
}
