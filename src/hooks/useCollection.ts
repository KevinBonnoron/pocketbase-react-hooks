import type { RecordModel } from 'pocketbase';
import { useEffect, useMemo, useRef } from 'react';
import { applyTransformers, sortRecords } from '../lib/utils';
import { dateTransformer } from '../transformers';
import type { CollectionRecord, DefaultDatabase, UseCollectionOptions, UseCollectionResult } from '../types';
import { useQueryState } from './internal/useQueryState';
import { usePocketBase } from './usePocketBase';

export function useCollection<TDatabase, TCollection extends keyof TDatabase & string>(
  collectionName: TCollection,
  options?: UseCollectionOptions<CollectionRecord<TDatabase, TCollection>>,
): UseCollectionResult<CollectionRecord<TDatabase, TCollection>>;

export function useCollection<TRecord extends RecordModel>(collectionName: string, options?: UseCollectionOptions<TRecord>): UseCollectionResult<TRecord>;

/**
 * Hook for fetching and subscribing to a PocketBase collection.
 *
 * Fetches all records from a collection with optional filtering, sorting, pagination,
 * and field selection. Automatically subscribes to real-time updates (create, update, delete)
 * and maintains local state accordingly.
 *
 * @template TDatabase - The database schema (inferred from PocketBaseProvider)
 * @template TCollection - The collection name (must be a key in TDatabase)
 * @template TRecord - The record type (used when providing explicit type)
 * @param collectionName - The name of the PocketBase collection
 * @param options - Query and subscription options
 * @returns Query result with loading state, data, and error
 *
 * @example Basic usage with explicit type
 * ```tsx
 * const { data, isLoading } = useCollection<Post>('posts', {
 *   filter: 'published = true',
 *   sort: '-created',
 * });
 * ```
 *
 * @example With typed database schema (auto-inferred from PocketBaseProvider)
 * ```tsx
 * // Types are automatically inferred from Database schema
 * const { data } = useCollection('posts'); // data: PostsResponse[]
 * ```
 */
export function useCollection<TRecord extends RecordModel>(collectionName: string, options: UseCollectionOptions<TRecord> = {}): UseCollectionResult<TRecord> {
  const { enabled = true, page, perPage, filter, sort, expand, fields, defaultValue, fetchAll = true, realtime = true, requestKey } = options;

  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);

  const queryState = useQueryState<TRecord[]>({
    defaultValue: defaultValue ?? [],
    initialLoading: enabled,
  });

  const transformers = useRef(options.transformers ?? [dateTransformer<TRecord>()]);
  transformers.current = options.transformers ?? [dateTransformer<TRecord>()];

  useEffect(() => {
    if (!enabled) {
      queryState.reset();
      return;
    }

    return queryState.executeFetch(async () => {
      let result: TRecord[] | null;
      if (fetchAll) {
        result = await recordService.getFullList<TRecord>({
          ...(page && { page }),
          ...(perPage && { perPage }),
          ...(filter && { filter }),
          ...(sort && { sort }),
          ...(expand && { expand }),
          ...(fields && { fields }),
          ...(requestKey && { requestKey }),
        });
      } else {
        const { items } = await recordService.getList<TRecord>(page ?? 1, perPage ?? 20, {
          ...(filter && { filter }),
          ...(sort && { sort }),
          ...(expand && { expand }),
          ...(fields && { fields }),
          ...(requestKey && { requestKey }),
        });
        result = items;
      }

      return result ? result.map((record) => applyTransformers(record, transformers.current)) : [];
    }, 'Failed to fetch collection');
  }, [enabled, recordService, page, perPage, filter, sort, expand, fields, fetchAll, requestKey, queryState.reset, queryState.executeFetch]);

  useEffect(() => {
    if (!enabled || !realtime) return;

    const unsubscribe = recordService.subscribe<TRecord>(
      '*',
      (e) => {
        queryState.setData((currentData) => {
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
  }, [enabled, realtime, recordService, expand, filter, sort, requestKey, queryState.setData]);

  return queryState.result;
}
