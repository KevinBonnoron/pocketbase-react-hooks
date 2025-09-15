import type { RecordModel } from 'pocketbase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createQueryResult } from '../lib/utils';
import type { UseRecordOptions, UseRecordResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useRecord<Record extends RecordModel>(collectionName: string, recordId: Record['id'] | null | undefined, options?: UseRecordOptions<Record>): UseRecordResult<Record>;
export function useRecord<Record extends RecordModel>(collectionName: string, filter: string | null | undefined, options?: UseRecordOptions<Record>): UseRecordResult<Record>;
export function useRecord<Record extends RecordModel>(collectionName: string, recordIdOrFilter: Record['id'] | string | null | undefined, options: UseRecordOptions<Record> = {}): UseRecordResult<Record> {
  const { expand, fields, defaultValue, requestKey } = options;
  const pb = usePocketBase();

  const isId = recordIdOrFilter ? !/[=<>~]/.test(recordIdOrFilter) : false;
  const defaultValueRef = useRef(defaultValue);

  const [data, setData] = useState<Record | null>(defaultValue ?? null);
  const [isLoading, setIsLoading] = useState(!!recordIdOrFilter);
  const [error, setError] = useState<string | null>(null);

  // Fetcher function
  const fetcher = useCallback(async (): Promise<Record> => {
    if (!recordIdOrFilter) {
      throw new Error('Record ID or filter is required');
    }

    if (isId) {
      return await pb.collection(collectionName).getOne(recordIdOrFilter, {
        ...(expand && { expand }),
        ...(fields && { fields }),
        ...(requestKey && { requestKey }),
      });
    } else {
      return await pb.collection(collectionName).getFirstListItem(recordIdOrFilter, {
        ...(expand && { expand }),
        ...(fields && { fields }),
        ...(requestKey && { requestKey }),
      });
    }
  }, [pb, collectionName, recordIdOrFilter, expand, fields, isId, requestKey]);

  // Fetch data
  useEffect(() => {
    if (!recordIdOrFilter) {
      setData(defaultValueRef.current ?? null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch record';
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
  }, [recordIdOrFilter, fetcher]);

  // Setup subscription
  useEffect(() => {
    if (!recordIdOrFilter || !data) return;

    if (isId) {
      const unsubscribe = pb.collection(collectionName).subscribe(
        recordIdOrFilter,
        (e) => {
          switch (e.action) {
            case 'update':
              setData(e.record as Record);
              break;
            case 'delete':
              setData(null);
              break;
          }
        },
        {
          expand,
          ...(requestKey && { requestKey }),
        },
      );

      return () => {
        unsubscribe.then((unsub) => unsub());
      };
    } else {
      const unsubscribe = pb.collection(collectionName).subscribe(
        '*',
        (e) => {
          switch (e.action) {
            case 'create':
            case 'update':
              setData(e.record as Record);
              break;
            case 'delete':
              if (data && e.record.id === data.id) {
                setData(null);
              }
              break;
          }
        },
        {
          expand,
          filter: recordIdOrFilter,
          ...(requestKey && { requestKey }),
        },
      );

      return () => {
        unsubscribe.then((unsub) => unsub());
      };
    }
  }, [pb, collectionName, recordIdOrFilter, expand, isId, data, requestKey]);

  return createQueryResult(isLoading, error, data);
}
