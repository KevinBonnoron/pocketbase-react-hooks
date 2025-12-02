import type { RecordModel } from 'pocketbase';
import { useEffect, useMemo, useRef, useState } from 'react';
import { queryCache } from '../lib/queryCache';
import { generateQueryKey } from '../lib/queryKey';
import { applyTransformers } from '../lib/utils';
import { dateTransformer } from '../transformers';
import type { UseRecordOptions, UseRecordResult } from '../types';
import type { QueryResult } from '../types/query-result.type';
import { usePocketBase } from './usePocketBase';

function isAutoCancelError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || error.message.includes('autocancelled');
}

/**
 * Hook for fetching and subscribing to a single PocketBase record.
 *
 * Fetches a single record either by ID or by filter query. Automatically subscribes
 * to real-time updates for that specific record (or matching filter). Supports
 * field selection and relation expansion.
 *
 * @template Record - The record type extending RecordModel
 * @param collectionName - The name of the PocketBase collection
 * @param recordIdOrFilter - Either a record ID or a PocketBase filter string
 * @param options - Query and subscription options
 * @returns Query result with loading state, data, and error
 *
 * @example
 * ```tsx
 * // Fetch by ID
 * const { data: post, isLoading } = useRecord<Post>('posts', 'record_id', {
 *   expand: 'author,comments',
 * });
 *
 * // Fetch by filter
 * const { data: user } = useRecord<User>('users', 'email = "user@example.com"');
 * ```
 */
export function useRecord<Record extends RecordModel>(collectionName: string, recordId: Record['id'] | null | undefined, options?: UseRecordOptions<Record>): UseRecordResult<Record>;
export function useRecord<Record extends RecordModel>(collectionName: string, filter: string | null | undefined, options?: UseRecordOptions<Record>): UseRecordResult<Record>;
export function useRecord<Record extends RecordModel>(collectionName: string, recordIdOrFilter: Record['id'] | string | null | undefined, options: UseRecordOptions<Record> = {}): UseRecordResult<Record> {
  const { expand, fields, defaultValue, realtime = true, requestKey } = options;
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);

  const isId = recordIdOrFilter ? !/[=<>~]/.test(recordIdOrFilter) : false;

  const [data, setData] = useState<Record | undefined>(defaultValue);
  const [isLoading, setIsLoading] = useState(!!recordIdOrFilter);
  const [error, setError] = useState<string | null>(null);

  const transformers = useRef(options.transformers ?? [dateTransformer<Record>()]);
  useEffect(() => {
    transformers.current = options.transformers ?? [dateTransformer<Record>()];
  }, [options.transformers]);

  const cacheKey = useMemo(
    () =>
      requestKey ??
      generateQueryKey({
        collection: collectionName,
        recordIdOrFilter,
        expand,
        fields,
        isId,
      }),
    [collectionName, recordIdOrFilter, expand, fields, isId, requestKey],
  );

  useEffect(() => {
    if (!recordIdOrFilter) {
      setData(defaultValue);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await queryCache.fetch<Record>(cacheKey, async () => {
          const rawData = isId
            ? await recordService.getOne<Record>(recordIdOrFilter, {
                ...(expand && { expand }),
                ...(fields && { fields }),
                ...(requestKey && { requestKey }),
              })
            : await recordService.getFirstListItem<Record>(recordIdOrFilter, {
                ...(expand && { expand }),
                ...(fields && { fields }),
                ...(requestKey && { requestKey }),
              });

          return applyTransformers(rawData, transformers.current);
        });

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled && !isAutoCancelError(err)) {
          setError(err instanceof Error ? err.message : 'Failed to fetch record');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const unsubscribe = queryCache.subscribe<Record>(cacheKey, (cachedData) => {
      if (!cancelled) {
        setData(cachedData);
      }
    });

    fetchData();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [recordIdOrFilter, recordService, expand, fields, isId, requestKey, cacheKey, defaultValue]);

  useEffect(() => {
    if (!recordIdOrFilter || !realtime) return;

    if (isId) {
      const unsubscribe = recordService.subscribe<Record>(
        recordIdOrFilter,
        (e) => {
          switch (e.action) {
            case 'update':
              setError(null);
              setData(applyTransformers(e.record, transformers.current));
              break;
            case 'delete':
              setData(undefined);
              break;
          }
        },
        {
          ...(expand && { expand }),
          ...(requestKey && { requestKey }),
        },
      );

      return () => {
        unsubscribe.then((unsub) => unsub());
      };
    } else {
      const unsubscribe = recordService.subscribe<Record>(
        '*',
        (e) => {
          switch (e.action) {
            case 'create':
            case 'update':
              setError(null);
              setData(applyTransformers(e.record, transformers.current));
              break;
            case 'delete':
              setData((current) => (current && current.id === e.record.id ? undefined : current));
              break;
          }
        },
        {
          filter: recordIdOrFilter,
          ...(expand && { expand }),
          ...(requestKey && { requestKey }),
        },
      );

      return () => {
        unsubscribe.then((unsub) => unsub());
      };
    }
  }, [recordService, recordIdOrFilter, expand, isId, realtime, requestKey]);

  const result: QueryResult<Record | undefined> = useMemo(() => {
    if (isLoading) {
      return {
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
      };
    }

    if (error) {
      return {
        isLoading: false,
        isSuccess: false,
        isError: true,
        error,
        data: undefined,
      };
    }

    return {
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      data,
    };
  }, [isLoading, error, data]);

  return result;
}
