import type { CommonOptions, RecordModel } from 'pocketbase';
import { useCallback, useMemo, useState } from 'react';
import type { UseDeleteMutationResult } from '../types';
import { usePocketBase } from './usePocketBase';

/**
 * Hook for deleting records from a PocketBase collection.
 *
 * @param collectionName - The name of the PocketBase collection
 * @param id - The ID of the record to delete
 * @returns An object containing the mutate function and mutation state
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isSuccess, error } = useDeleteMutation('posts');
 *
 * const handleDelete = async () => {
 *   const success = await mutate('record_id');
 *   if (success) {
 *     console.log('Deleted successfully');
 *   }
 * };
 * ```
 */
export function useDeleteMutation<Record extends RecordModel = RecordModel>(collectionName: string, id: Record['id'] | null): UseDeleteMutationResult {
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
