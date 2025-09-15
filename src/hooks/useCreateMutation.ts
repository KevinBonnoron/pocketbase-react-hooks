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
 * const { mutate, isPending, isSuccess, error } = useCreateMutation<Post>('posts');
 *
 * const handleCreate = async () => {
 *   const newPost = await mutate({ title: 'Hello', content: 'World' });
 *   if (newPost) {
 *     console.log('Created:', newPost);
 *   }
 * };
 * ```
 */
export function useCreateMutation<Record extends RecordModel>(collectionName: string): UseCreateMutationResult<Record> {
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (bodyParams: Partial<Record>, options?: RecordOptions): Promise<Record | null> => {
      try {
        setIsPending(true);
        setError(null);
        const record = await recordService.create(bodyParams, options);
        return record as Record;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error creating record');
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [recordService],
  );

  return useMemo(
    (): UseCreateMutationResult<Record> => ({
      mutate,
      isPending,
      error,
      isSuccess: !isPending && !error,
    }),
    [mutate, isPending, error],
  );
}
