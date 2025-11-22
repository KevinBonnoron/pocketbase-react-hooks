import type { RecordModel, RecordOptions } from 'pocketbase';
import { useCallback, useMemo, useState } from 'react';
import type { CollectionRecord, UseUpdateMutationResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useUpdateMutation<TDatabase extends Record<string, RecordModel>, TCollection extends keyof TDatabase & string>(collectionName: TCollection, id: CollectionRecord<TDatabase, TCollection>['id'] | null): UseUpdateMutationResult<CollectionRecord<TDatabase, TCollection>>;

export function useUpdateMutation<TRecord extends RecordModel>(collectionName: string, id: TRecord['id'] | null): UseUpdateMutationResult<TRecord>;

/**
 * Hook for updating existing records in a PocketBase collection.
 *
 * @template TDatabase - The database schema (inferred from PocketBaseProvider)
 * @template TCollection - The collection name (must be a key in TDatabase)
 * @template TRecord - The record type (used when providing explicit type)
 * @param collectionName - The name of the PocketBase collection
 * @param id - The ID of the record to update
 * @returns An object containing the mutate function and mutation state
 *
 * @example Basic usage with explicit type
 * ```tsx
 * const { mutateAsync, isPending } = useUpdateMutation<Post>('posts', postId);
 * await mutateAsync({ title: 'Updated' });
 * ```
 *
 * @example With typed database schema (auto-inferred from PocketBaseProvider)
 * ```tsx
 * // Types are automatically inferred from Database schema
 * const { mutateAsync } = useUpdateMutation('posts', postId);
 * await mutateAsync({ title: 'Updated' }); // Typed as PostsResponse
 * ```
 */
export function useUpdateMutation<TRecord extends RecordModel>(collectionName: string, id: TRecord['id'] | null): UseUpdateMutationResult<TRecord> {
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutateAsync = useCallback(
    async (bodyParams: Partial<TRecord>, options?: RecordOptions): Promise<TRecord> => {
      if (!id) {
        throw new Error('ID is required');
      }

      try {
        setIsPending(true);
        setError(null);
        const record = options ? await recordService.update(id, bodyParams, options) : await recordService.update(id, bodyParams);
        return record as TRecord;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error updating record';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsPending(false);
      }
    },
    [recordService, id],
  );

  const mutate = useCallback(
    (bodyParams: Partial<TRecord>, options?: RecordOptions): void => {
      mutateAsync(bodyParams, options).catch(() => {
        // Error is already handled in mutateAsync
      });
    },
    [mutateAsync],
  );

  return useMemo(
    (): UseUpdateMutationResult<TRecord> => ({
      mutate,
      mutateAsync,
      isPending,
      isError: !!error,
      error,
      isSuccess: !isPending && !error,
    }),
    [mutate, mutateAsync, isPending, error],
  );
}
