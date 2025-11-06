import type { RecordModel } from 'pocketbase';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { applyTransformers } from '../lib/utils';
import { dateTransformer } from '../transformers';
import type { CollectionRecord, UseRecordOptions, UseRecordResult } from '../types';
import { useQueryState } from './internal/useQueryState';
import { usePocketBase } from './usePocketBase';

export function useRecord<TDatabase, TCollection extends keyof TDatabase & string>(
  collectionName: TCollection,
  recordId: CollectionRecord<TDatabase, TCollection>['id'] | null | undefined,
  options?: UseRecordOptions<CollectionRecord<TDatabase, TCollection>>,
): UseRecordResult<CollectionRecord<TDatabase, TCollection>>;

export function useRecord<TDatabase, TCollection extends keyof TDatabase & string>(
  collectionName: TCollection,
  filter: string | null | undefined,
  options?: UseRecordOptions<CollectionRecord<TDatabase, TCollection>>,
): UseRecordResult<CollectionRecord<TDatabase, TCollection>>;

export function useRecord<TRecord extends RecordModel>(collectionName: string, recordId: TRecord['id'] | null | undefined, options?: UseRecordOptions<TRecord>): UseRecordResult<TRecord>;

export function useRecord<TRecord extends RecordModel>(collectionName: string, filter: string | null | undefined, options?: UseRecordOptions<TRecord>): UseRecordResult<TRecord>;

/**
 * Hook for fetching and subscribing to a single PocketBase record.
 *
 * Fetches a single record either by ID or by filter query. Automatically subscribes
 * to real-time updates for that specific record (or matching filter). Supports
 * field selection and relation expansion.
 *
 * @template TDatabase - The database schema (inferred from PocketBaseProvider)
 * @template TCollection - The collection name (must be a key in TDatabase)
 * @template TRecord - The record type (used when providing explicit type)
 * @param collectionName - The name of the PocketBase collection
 * @param recordIdOrFilter - Either a record ID or a PocketBase filter string
 * @param options - Query and subscription options
 * @returns Query result with loading state, data, and error
 *
 * @example Basic usage with explicit type
 * ```tsx
 * const { data: post } = useRecord<Post>('posts', 'record_id');
 * ```
 *
 * @example With typed database schema (auto-inferred from PocketBaseProvider)
 * ```tsx
 * // Types are automatically inferred from Database schema
 * const { data } = useRecord('posts', postId); // data: PostsResponse | null
 * ```
 */
export function useRecord<TRecord extends RecordModel>(collectionName: string, recordIdOrFilter: TRecord['id'] | string | null | undefined, options: UseRecordOptions<TRecord> = {}): UseRecordResult<TRecord> {
  const { expand, fields, defaultValue, realtime = true, requestKey } = options;
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);

  const isId = recordIdOrFilter ? !/[=<>~]/.test(recordIdOrFilter) : false;

  const queryState = useQueryState<TRecord | null>({
    defaultValue: defaultValue ?? null,
    initialLoading: !!recordIdOrFilter,
  });

  const transformers = useRef(options.transformers ?? [dateTransformer<TRecord>()]);
  useEffect(() => {
    transformers.current = options.transformers ?? [dateTransformer<TRecord>()];
  }, [options.transformers]);

  const fetcher = useCallback(async (): Promise<TRecord> => {
    if (!recordIdOrFilter) {
      throw new Error('Record ID or filter is required');
    }

    if (isId) {
      return await recordService.getOne<TRecord>(recordIdOrFilter, {
        ...(expand && { expand }),
        ...(fields && { fields }),
        ...(requestKey && { requestKey }),
      });
    }
    return await recordService.getFirstListItem<TRecord>(recordIdOrFilter, {
      ...(expand && { expand }),
      ...(fields && { fields }),
      ...(requestKey && { requestKey }),
    });
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
      const unsubscribe = recordService.subscribe<TRecord>(
        recordIdOrFilter,
        (e) => {
          switch (e.action) {
            case 'update':
              queryState.setData(() => applyTransformers(e.record, transformers.current));
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
    }
    const unsubscribe = recordService.subscribe<TRecord>(
      '*',
      (e) => {
        switch (e.action) {
          case 'create':
          case 'update':
            queryState.setData(() => applyTransformers(e.record, transformers.current));
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
  }, [recordService, recordIdOrFilter, expand, isId, realtime, queryState.setData, requestKey]);

  return queryState.result;
}
