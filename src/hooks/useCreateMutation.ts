import type { RecordModel, RecordOptions } from 'pocketbase';
import { useCallback, useMemo, useState } from 'react';
import type { UseCreateMutationResult } from '../types';
import { usePocketBase } from './usePocketBase';

/**
 * Hook for creating new records in a PocketBase collection.
 *
 * @template Record - The record type extending RecordModel
 * @param collectionName - The name of the PocketBase collection
 * @returns An object containing the mutate function and mutation state
 *
 * @example
 * ```tsx
 * const { mutateAsync, isPending, isSuccess, isError, error } = useCreateMutation<Post>('posts');
 *
 * const handleCreate = async () => {
 *   try {
 *     const newPost = await mutateAsync({ title: 'Hello', content: 'World' });
 *     console.log('Created:', newPost);
 *   } catch (err) {
 *     console.error('Failed to create post:', err);
 *   }
 * };
 * ```
 */
export function useCreateMutation<Record extends RecordModel>(collectionName: string): UseCreateMutationResult<Record> {
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutateAsync = useCallback(
    async (bodyParams: Partial<Record>, options?: RecordOptions): Promise<Record> => {
      try {
        setIsPending(true);
        setError(null);
        const record = options ? await recordService.create(bodyParams, options) : await recordService.create(bodyParams);
        return record as Record;
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
    (bodyParams: Partial<Record>, options?: RecordOptions): void => {
      mutateAsync(bodyParams, options).catch(() => {
        // Error is already handled in mutateAsync
      });
    },
    [mutateAsync],
  );

  return useMemo(
    (): UseCreateMutationResult<Record> => ({
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
