import type { CommonOptions } from 'pocketbase';
import { useCallback, useMemo, useState } from 'react';
import type { UseDeleteMutationResult } from '../types';
import { usePocketBase } from './usePocketBase';

/**
 * Hook for deleting records from a PocketBase collection.
 *
 * @param collectionName - The name of the PocketBase collection
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
export function useDeleteMutation(collectionName: string): UseDeleteMutationResult {
  const pb = usePocketBase();
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (id: string, options?: CommonOptions): Promise<boolean> => {
      try {
        setIsPending(true);
        setError(null);
        await recordService.delete(id, options);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error deleting record');
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [recordService],
  );

  return useMemo(
    (): UseDeleteMutationResult => ({
      mutate,
      isPending,
      error,
      isSuccess: !isPending && !error,
    }),
    [mutate, isPending, error],
  );
}
