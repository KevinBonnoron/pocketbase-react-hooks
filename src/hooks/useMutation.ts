import type { RecordModel } from 'pocketbase';
import { useCallback, useMemo, useState } from 'react';
import type { UseMutationResult } from '../types';
import { usePocketbase } from './usePocketbase';

export function useMutation<Record extends RecordModel>(collectionName: string): UseMutationResult<Record> {
  const pb = usePocketbase();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: Partial<Record>): Promise<Record | null> => {
      try {
        setIsPending(true);
        setError(null);
        const record = await pb.collection(collectionName).create(data);
        return record as Record;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error creating record');
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [pb, collectionName],
  );

  const update = useCallback(
    async (id: string, data: Partial<Record>): Promise<Record | null> => {
      try {
        setIsPending(true);
        setError(null);
        const record = await pb.collection(collectionName).update(id, data);
        return record as Record;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error updating record');
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [pb, collectionName],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setIsPending(true);
        setError(null);
        await pb.collection(collectionName).delete(id);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error deleting record');
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [pb, collectionName],
  );

  return useMemo((): UseMutationResult<Record> => {
    if (isPending) {
      return {
        isPending: true,
        isError: false,
        isSuccess: false,
        error: null,
        create,
        update,
        remove,
      };
    }

    if (error) {
      return {
        isPending: false,
        isError: true,
        isSuccess: false,
        error,
        create,
        update,
        remove,
      };
    }

    return {
      isPending: false,
      isError: false,
      isSuccess: true,
      error: null,
      create,
      update,
      remove,
    };
  }, [isPending, error, create, update, remove]);
}
