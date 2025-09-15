import type { RecordModel } from 'pocketbase';
import { useEffect, useState } from 'react';
import { createQueryResult, sortRecords } from '../lib/utils';
import type { UseCollectionOptions, UseCollectionResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useCollection<Record extends RecordModel>(collectionName: string, options: UseCollectionOptions<Record> = {}): UseCollectionResult<Record> {
  const pb = usePocketBase();
  const { enabled = true, page, perPage, filter, sort, expand, fields, defaultValue } = options;
  const [data, setData] = useState<Record[] | null>(defaultValue ?? null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result: Record[] = await pb.collection(collectionName).getFullList({
          ...(page && { page }),
          ...(perPage && { perPage }),
          ...(filter && { filter }),
          ...(sort && { sort }),
          ...(expand && { expand }),
          ...(fields && { fields }),
        });

        setData(result);
      } catch (err) {
        setData(null);
        if (err instanceof Error && err.message.includes('The request was autocancelled')) {
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to fetch collection');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pb, collectionName, enabled, filter, sort, expand, fields, page, perPage]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unsubscribe = pb.collection(collectionName).subscribe(
      '*',
      (e) => {
        setData((currentData) => {
          if (!currentData) {
            return currentData;
          }

          const newData = [...currentData];
          switch (e.action) {
            case 'create':
              newData.push(e.record as Record);
              break;

            case 'update':
              {
                const updateIndex = newData.findIndex(({ id }) => id === e.record.id);
                if (updateIndex !== -1) {
                  newData[updateIndex] = e.record as Record;
                } else {
                  newData.push(e.record as Record);
                }
              }
              break;

            case 'delete':
              {
                const deleteIndex = newData.findIndex(({ id }) => id === e.record.id);
                if (deleteIndex !== -1) {
                  newData.splice(deleteIndex, 1);
                }
              }
              break;
          }

          if (sort) {
            return sortRecords(newData, sort);
          }

          return newData;
        });
      },
      {
        expand,
        filter,
      },
    );

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [pb, collectionName, enabled, expand, filter, sort]);

  return createQueryResult(isLoading, error, enabled ? (data ?? []) : null);
}
