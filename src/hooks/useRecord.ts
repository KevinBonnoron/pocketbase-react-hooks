import type { RecordModel } from 'pocketbase';
import { useEffect, useState } from 'react';
import { createQueryResult } from '../lib/utils';
import type { UseRecordOptions, UseRecordResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useRecord(collectionName: string, recordId: string | null | undefined, options: UseRecordOptions = {}): UseRecordResult<RecordModel> {
  const pb = usePocketBase();
  const [data, setData] = useState<RecordModel | null>(options.defaultValue ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!recordId) {
        setData(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const record: RecordModel = await pb
          .autoCancellation(false)
          .collection(collectionName)
          .getOne(recordId, {
            ...(options.expand && { expand: options.expand }),
            ...(options.fields && { fields: options.fields }),
          });
        setData(record);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecord();
    if (!recordId) {
      return;
    }

    const unsubscribe = pb.collection(collectionName).subscribe(recordId, (e) => {
      if (e.action === 'update' && e.record) {
        setData(e.record as RecordModel);
      } else if (e.action === 'delete') {
        setData(null);
        setError('Record has been deleted');
      }
    });

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [pb, collectionName, recordId, options.expand, options.fields]);

  return createQueryResult(isLoading, error, data);
}
