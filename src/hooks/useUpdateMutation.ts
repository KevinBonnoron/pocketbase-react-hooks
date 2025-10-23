import type { RecordModel, RecordOptions } from 'pocketbase';
import { useCallback, useMemo, useState } from 'react';
import type { UseUpdateMutationResult } from '../types';
import { usePocketBase } from './usePocketBase';

/**
 * Hook for updating existing records in a PocketBase collection.
 *
 * @template Record - The record type extending RecordModel
 * @param collectionName - The name of the PocketBase collection
 * @param id - The ID of the record to update
 * @returns An object containing the mutate function and mutation state
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isSuccess, error } = useUpdateMutation<Post>('posts');
 *
 * const handleUpdate = async () => {
 *   const updated = await mutate('record_id', { title: 'Updated Title' });
 *   if (updated) {
 *     console.log('Updated:', updated);
 *   }
 * };
 * ```
 */
export function useUpdateMutation<Record extends RecordModel>(collectionName: string, id: Record['id'] | null): UseUpdateMutationResult<Record> {
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutateAsync = useCallback(
    async (bodyParams: Partial<Record>, options?: RecordOptions): Promise<Record> => {
      if (!id) {
        throw new Error('ID is required');
      }

      try {
        setIsPending(true);
        setError(null);
        const record = options ? await recordService.update(id, bodyParams, options) : await recordService.update(id, bodyParams);
        return record as Record;
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
    (bodyParams: Partial<Record>, options?: RecordOptions): void => {
      mutateAsync(bodyParams, options).catch(() => {
        // Error is already handled in mutateAsync
      });
    },
    [mutateAsync],
  );

  return useMemo(
    (): UseUpdateMutationResult<Record> => ({
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
