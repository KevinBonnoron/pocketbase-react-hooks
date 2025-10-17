import type { RecordModel } from 'pocketbase';

/**
 * A function that transforms a record into a new record.
 *
 * @template T - The record type extending RecordModel
 * @param record - The record to transform
 * @returns The transformed record
 */
export type RecordTransformer<T extends RecordModel> = (record: T) => T;
