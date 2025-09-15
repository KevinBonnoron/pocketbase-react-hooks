import type { RecordModel } from 'pocketbase';
import { useCallback, useEffect, useMemo } from 'react';
import type { UseRecordOptions, UseRecordResult } from '../types';
import { useQueryState } from './internal/useQueryState';
import { usePocketBase } from './usePocketBase';

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
  const { expand, fields, defaultValue, requestKey } = options;
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);

  const isId = recordIdOrFilter ? !/[=<>~]/.test(recordIdOrFilter) : false;

  const queryState = useQueryState<Record | null>({
    defaultValue: defaultValue ?? null,
    initialLoading: !!recordIdOrFilter,
  });

  const fetcher = useCallback(async (): Promise<Record> => {
    if (!recordIdOrFilter) {
      throw new Error('Record ID or filter is required');
    }

    if (isId) {
      return await recordService.getOne(recordIdOrFilter, {
        ...(expand && { expand }),
        ...(fields && { fields }),
        ...(requestKey && { requestKey }),
      });
    } else {
      return await recordService.getFirstListItem(recordIdOrFilter, {
        ...(expand && { expand }),
        ...(fields && { fields }),
        ...(requestKey && { requestKey }),
      });
    }
  }, [recordService, recordIdOrFilter, expand, fields, isId, requestKey]);

  useEffect(() => {
    if (!recordIdOrFilter) {
      queryState.reset();
      return;
    }

    return queryState.executeFetch(fetcher, 'Failed to fetch record');
  }, [recordIdOrFilter, fetcher, queryState.reset, queryState.executeFetch]);

  useEffect(() => {
    if (!recordIdOrFilter || !queryState.data) return;

    if (isId) {
      const unsubscribe = recordService.subscribe(
        recordIdOrFilter,
        (e) => {
          switch (e.action) {
            case 'update':
              queryState.setData(e.record as Record);
              break;
            case 'delete':
              queryState.setData(null);
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
      const unsubscribe = recordService.subscribe(
        '*',
        (e) => {
          switch (e.action) {
            case 'create':
            case 'update':
              queryState.setData(e.record as Record);
              break;
            case 'delete':
              if (queryState.data && e.record.id === queryState.data.id) {
                queryState.setData(null);
              }
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
  }, [recordService, recordIdOrFilter, expand, isId, queryState.data, queryState.setData, requestKey]);

  return queryState.result;
}
