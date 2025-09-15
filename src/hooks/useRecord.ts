import type { RecordModel } from 'pocketbase';
import { useEffect, useState } from 'react';
import { createQueryResult } from '../lib/utils';
import type { UseRecordOptions, UseRecordResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useRecord<Record extends RecordModel>(collectionName: string, recordId: Record['id'] | null | undefined, options?: UseRecordOptions<Record>): UseRecordResult<Record>;
export function useRecord<Record extends RecordModel>(collectionName: string, filter: string | null | undefined, options?: UseRecordOptions<Record>): UseRecordResult<Record>;
export function useRecord<Record extends RecordModel>(collectionName: string, recordIdOrFilter: Record['id'] | string | null | undefined, options: UseRecordOptions<Record> = {}): UseRecordResult<Record> {
  const pb = usePocketBase();
  const [data, setData] = useState<Record | null>(options.defaultValue ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isId = recordIdOrFilter ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recordIdOrFilter) : false;

  useEffect(() => {
    const fetchRecord = async () => {
      if (!recordIdOrFilter) {
        setData(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const record: Record = isId
          ? await pb
              .autoCancellation(false)
              .collection(collectionName)
              .getOne(recordIdOrFilter, {
                ...(options.expand && { expand: options.expand }),
                ...(options.fields && { fields: options.fields }),
              })
          : await pb
              .autoCancellation(false)
              .collection(collectionName)
              .getFirstListItem(recordIdOrFilter, {
                ...(options.expand && { expand: options.expand }),
                ...(options.fields && { fields: options.fields }),
              });

        setData(record);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch record');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecord();
  }, [pb, collectionName, recordIdOrFilter, options.expand, options.fields, isId]);

  useEffect(() => {
    if (!recordIdOrFilter) {
      return;
    }

    const unsubscribe = pb.collection(collectionName).subscribe(
      isId ? recordIdOrFilter : '*',
      (e) => {
        if (isId) {
          if (e.action === 'update' && e.record) {
            setData(e.record as Record);
          } else if (e.action === 'delete') {
            setData(null);
            setError('Record has been deleted');
          }
        } else {
          if (e.action === 'update' && e.record && data && e.record.id === data.id) {
            setData(e.record as Record);
          } else if (e.action === 'delete' && data && e.record.id === data.id) {
            setData(null);
            setError('Record has been deleted');
          } else if (e.action === 'create' && e.record) {
            const newRecord = e.record as Record;
            if (data && newRecord.id !== data.id) {
              setData(newRecord);
            }
          }
        }
      },
      {
        ...(options.expand && { expand: options.expand }),
        ...(options.fields && { fields: options.fields }),
        ...(!isId && { filter: recordIdOrFilter }),
      },
    );

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [pb, collectionName, recordIdOrFilter, options.expand, options.fields, data, isId]);

  return createQueryResult(isLoading, error, data);
}
