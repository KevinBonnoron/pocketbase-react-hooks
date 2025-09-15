import type { RecordModel } from 'pocketbase';
import type { QueryResult } from './query-result.type';
import type { UseCommonOptions } from './useCommon.type';

/**
 * Options for configuring the useRecord hook.
 *
 * @template T - The record type extending RecordModel
 */
export interface UseRecordOptions<T extends RecordModel> extends UseCommonOptions {
  /**
   * Default value to use before data is loaded
   */
  defaultValue?: T | null;

  /**
   * Request key for cancellation via pb.cancelRequest()
   */
  requestKey?: string;
}

/**
 * Result type returned by useRecord hook.
 *
 * @template T - The record type extending RecordModel
 */
export type UseRecordResult<T extends RecordModel = RecordModel> = QueryResult<T | null>;
