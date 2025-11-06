import type { CommonOptions, RecordModel } from 'pocketbase';
import { useCallback, useMemo, useState } from 'react';
import type { CollectionRecord, UseDeleteMutationResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useDeleteMutation<TDatabase extends Record<string, RecordModel>, TCollection extends keyof TDatabase & string>(
  collectionName: TCollection,
  id: CollectionRecord<TDatabase, TCollection>['id'] | null,
): UseDeleteMutationResult;

export function useDeleteMutation<TRecord extends RecordModel = RecordModel>(collectionName: string, id: TRecord['id'] | null): UseDeleteMutationResult;

/**
 * Hook for deleting records from a PocketBase collection.
 *
 * @template TDatabase - The database schema (inferred from PocketBaseProvider)
 * @template TCollection - The collection name (must be a key in TDatabase)
 * @template TRecord - The record type (used when providing explicit type)
 * @param collectionName - The name of the PocketBase collection
 * @param id - The ID of the record to delete
 * @returns An object containing the mutate function and mutation state
 *
 * @example Basic usage
 * ```tsx
 * const { mutateAsync, isPending } = useDeleteMutation('posts', postId);
 * await mutateAsync();
 * ```
 *
 * @example With typed database schema (auto-inferred from PocketBaseProvider)
 * ```tsx
 * // Collection name is type-checked against Database schema
 * const { mutateAsync } = useDeleteMutation('posts', postId);
 * await mutateAsync();
 * ```
 */
export function useDeleteMutation<TRecord extends RecordModel = RecordModel>(collectionName: string, id: TRecord['id'] | null): UseDeleteMutationResult {
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutateAsync = useCallback(
    async (options?: CommonOptions): Promise<void> => {
      if (!id) {
        throw new Error('ID is required');
      }

      try {
        setIsPending(true);
        setError(null);
        await recordService.delete(id, options);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error deleting record';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsPending(false);
      }
    },
    [recordService, id],
  );

  const mutate = useCallback(
    (options?: CommonOptions): void => {
      mutateAsync(options).catch(() => {
        // Error is already handled in mutateAsync
      });
    },
    [mutateAsync],
  );

  return useMemo(
    (): UseDeleteMutationResult => ({
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
