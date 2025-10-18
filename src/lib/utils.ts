import type { RecordModel } from 'pocketbase';
import type { RecordTransformer } from '../types';

export function sortRecords<T extends RecordModel>(records: T[], sortString: string): T[] {
  const [direction, field] = sortString.startsWith('-') ? ['desc', sortString.slice(1)] : ['asc', sortString.startsWith('+') ? sortString.slice(1) : sortString];

  return [...records].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[field];
    const bVal = (b as Record<string, unknown>)[field];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    }

    const aStr = String(aVal);
    const bStr = String(bVal);
    if (aStr < bStr) return direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Applies transformers to a record with error handling.
 * If any transformer fails, the error is logged to the console and the record is returned unchanged.
 *
 * @template T - The record type extending RecordModel
 * @param record - The record to transform
 * @param transformers - Array of transformer functions
 * @returns The transformed record or original if transformation fails
 */
export const applyTransformers = <T extends RecordModel>(record: T, transformers: RecordTransformer<T>[]): T => {
  return transformers.reduce((data, transformer) => {
    try {
      return transformer(data);
    } catch (error) {
      console.error('Error applying transformers:', error);
      return data;
    }
  }, record);
};
