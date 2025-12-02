import type { RecordModel } from 'pocketbase';
import { useEffect, useMemo, useRef, useState } from 'react';
import { queryCache } from '../lib/queryCache';
import { generateQueryKey } from '../lib/queryKey';
import { applyTransformers, sortRecords } from '../lib/utils';
import { dateTransformer } from '../transformers';
import type { UseCollectionOptions, UseCollectionResult } from '../types';
import type { QueryResult } from '../types/query-result.type';
import { usePocketBase } from './usePocketBase';

function isAutoCancelError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || error.message.includes('autocancelled');
}

/**
 * Hook for fetching and subscribing to a PocketBase collection.
 *
 * Fetches all records from a collection with optional filtering, sorting, pagination,
 * and field selection. Automatically subscribes to real-time updates (create, update, delete)
 * and maintains local state accordingly.
 *
 * @template Record - The record type extending RecordModel
 * @param collectionName - The name of the PocketBase collection
 * @param options - Query and subscription options
 * @returns Query result with loading state, data, and error
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error } = useCollection<Post>('posts', {
 *   filter: 'published = true',
 *   sort: '-created',
 *   expand: 'author',
 * });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (isError) return <div>Error: {error}</div>;
 * return <div>{data.map(post => <Post key={post.id} {...post} />)}</div>;
 * ```
 */
export function useCollection<Record extends RecordModel>(collectionName: string, options: UseCollectionOptions<Record> = {}): UseCollectionResult<Record> {
  const { enabled = true, page, perPage, filter, sort, expand, fields, defaultValue, fetchAll = true, realtime = true, requestKey } = options;

  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);

  const [data, setData] = useState<Record[] | undefined>(defaultValue);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const transformers = useRef(options.transformers ?? [dateTransformer<Record>()]);
  transformers.current = options.transformers ?? [dateTransformer<Record>()];

  const cacheKey = useMemo(
    () =>
      requestKey ??
      generateQueryKey({
        collection: collectionName,
        page,
        perPage,
        filter,
        sort,
        expand,
        fields,
        fetchAll,
      }),
    [collectionName, page, perPage, filter, sort, expand, fields, fetchAll, requestKey],
  );

  useEffect(() => {
    if (!enabled) {
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

        const result = await queryCache.fetch<Record[]>(cacheKey, async () => {
          let rawData: Record[] | null;
          if (fetchAll) {
            rawData = await recordService.getFullList<Record>({
              ...(page && { page }),
              ...(perPage && { perPage }),
              ...(filter && { filter }),
              ...(sort && { sort }),
              ...(expand && { expand }),
              ...(fields && { fields }),
              ...(requestKey && { requestKey }),
            });
          } else {
            const { items } = await recordService.getList<Record>(page ?? 1, perPage ?? 20, {
              ...(filter && { filter }),
              ...(sort && { sort }),
              ...(expand && { expand }),
              ...(fields && { fields }),
              ...(requestKey && { requestKey }),
            });
            rawData = items;
          }

          return rawData ? rawData.map((record) => applyTransformers(record, transformers.current)) : [];
        });

        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled && !isAutoCancelError(err)) {
          setError(err instanceof Error ? err.message : 'Failed to fetch collection');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const unsubscribe = queryCache.subscribe<Record[]>(cacheKey, (cachedData) => {
      if (!cancelled) {
        setData(cachedData);
      }
    });

    fetchData();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled, recordService, page, perPage, filter, sort, expand, fields, fetchAll, requestKey, cacheKey, defaultValue]);

  useEffect(() => {
    if (!enabled || !realtime) return;

    const unsubscribe = recordService.subscribe<Record>(
      '*',
      (e) => {
        setData((currentData) => {
          let newData = currentData ? [...currentData] : [];
          switch (e.action) {
            case 'create':
              {
                newData.push(applyTransformers(e.record, transformers.current));
              }
              break;

            case 'update':
              {
                const updateIndex = newData.findIndex(({ id }) => id === e.record.id);
                if (updateIndex !== -1) {
                  newData[updateIndex] = applyTransformers(e.record, transformers.current);
                } else {
                  newData.push(applyTransformers(e.record, transformers.current));
                }
              }
              break;

            case 'delete':
              {
                const deleteIndex = newData.findIndex(({ id }) => id === e.record.id);
                if (deleteIndex !== -1) {
                  newData.splice(deleteIndex, 1);
                }
              }
              break;
          }

          if (sort) {
            newData = sortRecords(newData, sort);
          }

          return newData;
        });
      },
      {
        ...(expand && { expand }),
        ...(filter && { filter }),
        ...(requestKey && { requestKey }),
      },
    );

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [enabled, realtime, recordService, expand, filter, sort, requestKey]);

  const result: QueryResult<Record[]> = useMemo(() => {
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
      data: data as Record[],
    };
  }, [isLoading, error, data]);

  return result;
}
