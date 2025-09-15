import type { RecordModel, RecordOptions } from 'pocketbase';
import { useCallback, useMemo, useState } from 'react';
import type { UseUpdateMutationResult } from '../types';
import { usePocketBase } from './usePocketBase';

/**
 * Hook for updating existing records in a PocketBase collection.
 *
 * @template Record - The record type extending RecordModel
 * @param collectionName - The name of the PocketBase collection
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
export function useUpdateMutation<Record extends RecordModel>(collectionName: string): UseUpdateMutationResult<Record> {
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (id: string, bodyParams: Partial<Record>, options?: RecordOptions): Promise<Record | null> => {
      try {
        setIsPending(true);
        setError(null);
        const record = options ? await recordService.update(id, bodyParams, options) : await recordService.update(id, bodyParams);
        return record as Record;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error updating record');
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [recordService],
  );

  return useMemo(
    (): UseUpdateMutationResult<Record> => ({
      mutate,
      isPending,
      error,
      isSuccess: !isPending && !error,
    }),
    [mutate, isPending, error],
  );
}
