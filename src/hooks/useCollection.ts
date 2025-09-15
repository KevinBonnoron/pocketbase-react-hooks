import type { RecordModel } from 'pocketbase';
import { useEffect, useState } from 'react';
import { createQueryResult, sortRecords } from '../lib/utils';
import type { UseCollectionOptions, UseCollectionResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useCollection<Record extends RecordModel>(collectionName: string, options: UseCollectionOptions<Record> = {}): UseCollectionResult<Record> {
  const pb = usePocketBase();
  const [data, setData] = useState<Record[] | null>(options.defaultValue ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result: Record[] = await pb.collection(collectionName).getFullList({
          ...(options.page && { page: options.page }),
          ...(options.perPage && { perPage: options.perPage }),
          ...(options.filter && { filter: options.filter }),
          ...(options.sort && { sort: options.sort }),
          ...(options.expand && { expand: options.expand }),
          ...(options.fields && { fields: options.fields }),
        });

        setData(result);
      } catch (err) {
        if (err instanceof Error && err.message.includes('The request was autocancelled')) {
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to fetch collection');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pb, collectionName, options.filter, options.sort, options.expand, options.fields, options.page, options.perPage]);

  useEffect(() => {
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

          if (options.sort) {
            return sortRecords(newData, options.sort);
          }

          return newData;
        });
      },
      {
        expand: options.expand,
        filter: options.filter,
      },
    );

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [pb, collectionName, options.expand, options.filter, options.sort]);

  return createQueryResult(isLoading, error, data ?? []);
}
