import type { RecordModel } from 'pocketbase';
import { useEffect, useMemo } from 'react';
import { sortRecords } from '../lib/utils';
import type { UseCollectionOptions, UseCollectionResult } from '../types';
import { useQueryState } from './internal/useQueryState';
import { usePocketBase } from './usePocketBase';

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

  const queryState = useQueryState<Record[]>({
    defaultValue: defaultValue ?? [],
    initialLoading: enabled,
  });

  useEffect(() => {
    if (!enabled) {
      queryState.reset();
      return;
    }

    return queryState.executeFetch(async () => {
      let result: Record[];
      if (fetchAll) {
        result = await recordService.getFullList<Record>({
          ...(page && { page }),
          ...(perPage && { perPage }),
          ...(filter && { filter }),
          ...(sort && { sort }),
          ...(expand && { expand }),
          ...(fields && { fields }),
          ...(requestKey && { requestKey }),
        });
      } else {
        const listResult = await recordService.getList<Record>(page ?? 1, perPage ?? 20, {
          ...(filter && { filter }),
          ...(sort && { sort }),
          ...(expand && { expand }),
          ...(fields && { fields }),
          ...(requestKey && { requestKey }),
        });
        result = listResult.items;
      }
      return result;
    }, 'Failed to fetch collection');
  }, [enabled, recordService, page, perPage, filter, sort, expand, fields, fetchAll, requestKey, queryState.reset, queryState.executeFetch]);

  useEffect(() => {
    if (!enabled || !realtime) return;

    const unsubscribe = recordService.subscribe(
      '*',
      (e) => {
        queryState.setData((currentData) => {
          let newData = currentData ? [...currentData] : [];
          switch (e.action) {
            case 'create':
              newData.push(e.record as Record);
              break;

            case 'update':
              {
                const updateIndex = newData.findIndex(({ id }) => id === e.record.id);
                if (updateIndex !== -1) {
                  newData[updateIndex] = e.record as Record;
                } else {
                  newData.push(e.record as Record);
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
  }, [enabled, realtime, recordService, expand, filter, sort, requestKey, queryState.setData]);

  return queryState.result;
}
