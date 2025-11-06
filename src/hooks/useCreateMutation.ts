import type { RecordModel, RecordOptions } from 'pocketbase';
import { useCallback, useMemo, useState } from 'react';
import type { CollectionRecord, UseCreateMutationResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useCreateMutation<TDatabase extends Record<string, RecordModel>, TCollection extends keyof TDatabase & string>(
  collectionName: TCollection,
): UseCreateMutationResult<CollectionRecord<TDatabase, TCollection>>;

export function useCreateMutation<TRecord extends RecordModel>(collectionName: string): UseCreateMutationResult<TRecord>;

/**
 * Hook for creating new records in a PocketBase collection.
 *
 * @template TDatabase - The database schema (inferred from PocketBaseProvider)
 * @template TCollection - The collection name (must be a key in TDatabase)
 * @template TRecord - The record type (used when providing explicit type)
 * @param collectionName - The name of the PocketBase collection
 * @returns An object containing the mutate function and mutation state
 *
 * @example Basic usage with explicit type
 * ```tsx
 * const { mutateAsync, isPending } = useCreateMutation<Post>('posts');
 * await mutateAsync({ title: 'Hello', content: 'World' });
 * ```
 *
 * @example With typed database schema (auto-inferred from PocketBaseProvider)
 * ```tsx
 * // Types are automatically inferred from Database schema
 * const { mutateAsync } = useCreateMutation('posts');
 * await mutateAsync({ title: 'Hello' }); // Typed as PostsResponse
 * ```
 */
export function useCreateMutation<TRecord extends RecordModel>(collectionName: string): UseCreateMutationResult<TRecord> {
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutateAsync = useCallback(
    async (bodyParams: Partial<TRecord>, options?: RecordOptions): Promise<TRecord> => {
      try {
        setIsPending(true);
        setError(null);
        const record = options ? await recordService.create(bodyParams, options) : await recordService.create(bodyParams);
        return record as TRecord;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error creating record';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsPending(false);
      }
    },
    [recordService],
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
    (): UseCreateMutationResult<TRecord> => ({
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
