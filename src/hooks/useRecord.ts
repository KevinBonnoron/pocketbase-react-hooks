import type { RecordModel } from 'pocketbase';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { applyTransformers } from '../lib/utils';
import { dateTransformer } from '../transformers';
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
  const { expand, fields, defaultValue, realtime = true, requestKey } = options;
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);

  const isId = recordIdOrFilter ? !/[=<>~]/.test(recordIdOrFilter) : false;

  const queryState = useQueryState<Record | null>({
    defaultValue: defaultValue ?? null,
    initialLoading: !!recordIdOrFilter,
  });

  const transformers = useRef(options.transformers ?? [dateTransformer<Record>()]);
  useEffect(() => {
    transformers.current = options.transformers ?? [dateTransformer<Record>()];
  }, [options.transformers]);

  const fetcher = useCallback(async (): Promise<Record> => {
    if (!recordIdOrFilter) {
      throw new Error('Record ID or filter is required');
    }

    if (isId) {
      return await recordService.getOne<Record>(recordIdOrFilter, {
        ...(expand && { expand }),
        ...(fields && { fields }),
        ...(requestKey && { requestKey }),
      });
    } else {
      return await recordService.getFirstListItem<Record>(recordIdOrFilter, {
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

    return queryState.executeFetch(async () => {
      const record = await fetcher();
      return applyTransformers(record, transformers.current);
    }, 'Failed to fetch record');
  }, [recordIdOrFilter, fetcher, queryState.reset, queryState.executeFetch]);

  useEffect(() => {
    if (!recordIdOrFilter || !realtime) return;

    if (isId) {
      const unsubscribe = recordService.subscribe<Record>(
        recordIdOrFilter,
        (e) => {
          switch (e.action) {
            case 'update':
              queryState.setError(null);
              queryState.setData(applyTransformers(e.record, transformers.current));
              break;
            case 'delete':
              queryState.setData(() => null);
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
              queryState.setError(null);
              queryState.setData(applyTransformers(e.record, transformers.current));
              break;
            case 'delete':
              queryState.setData((current) => (current && current.id === e.record.id ? null : current));
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
  }, [recordService, recordIdOrFilter, expand, isId, realtime, queryState.setData, queryState.setError, requestKey]);

  return queryState.result;
}
