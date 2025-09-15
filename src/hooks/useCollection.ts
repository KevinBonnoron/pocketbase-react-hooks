import type { RecordModel } from 'pocketbase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createQueryResult, sortRecords } from '../lib/utils';
import type { UseCollectionOptions, UseCollectionResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useCollection<Record extends RecordModel>(collectionName: string, options: UseCollectionOptions<Record> = {}): UseCollectionResult<Record> {
  const { enabled = true, page, perPage, filter, sort, expand, fields, defaultValue, fetchAll = true, subscribe = true, requestKey } = options;

  const pb = usePocketBase();

  const defaultValueRef = useRef(defaultValue);

  const [data, setData] = useState<Record[]>(defaultValue ?? []);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  // Fetcher function - inline dans useEffect pour éviter les re-créations

  // Fetch data
  useEffect(() => {
    if (!enabled) {
      setData(defaultValueRef.current ?? []);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let result: Record[];
        if (fetchAll) {
          result = await pb.collection(collectionName).getFullList<Record>({
            ...(page && { page }),
            ...(perPage && { perPage }),
            ...(filter && { filter }),
            ...(sort && { sort }),
            ...(expand && { expand }),
            ...(fields && { fields }),
            ...(requestKey && { requestKey }),
          });
        } else {
          const listResult = await pb.collection(collectionName).getList<Record>(page ?? 1, perPage ?? 20, {
            ...(filter && { filter }),
            ...(sort && { sort }),
            ...(expand && { expand }),
            ...(fields && { fields }),
            ...(requestKey && { requestKey }),
          });
          result = listResult.items;
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collection';
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [enabled, pb, collectionName, page, perPage, filter, sort, expand, fields, fetchAll, requestKey]);

  // Setup subscription
  useEffect(() => {
    if (!enabled || !subscribe) return;

    const unsubscribe = pb.collection(collectionName).subscribe(
      '*',
      (e) => {
        setData((currentData) => {
          if (!currentData || currentData.length === 0) {
            return currentData;
          }

          let newData = [...currentData];

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
            newData = sortRecords(newData, sort);
          }

          return newData;
        });
      },
      {
        ...(expand && { expand }),
        ...(filter && { filter }),
        ...(requestKey && { requestKey }),
      },
    );

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [enabled, subscribe, pb, collectionName, expand, filter, sort, requestKey]);

  return createQueryResult(isLoading, error, data);
}
