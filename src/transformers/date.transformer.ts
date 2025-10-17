import type { RecordModel } from 'pocketbase';
import type { RecordTransformer } from '../types';

function isISODateString(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(str);
}

export function dateTransformer<Record extends RecordModel>(fields: (keyof Record)[] = ['created', 'updated']): RecordTransformer<Record> {
  return (record) => {
    const transformed: Record = { ...record };
    fields.forEach((field) => {
      const value = transformed[field];
      if (typeof value === 'string' && isISODateString(value)) {
        transformed[field] = new Date(value) as Record[typeof field];
      }
    });

    return transformed;
  };
}
