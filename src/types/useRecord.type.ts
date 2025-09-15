import type { RecordModel } from 'pocketbase';
import type { QueryResult } from './query-result.type';
import type { UseCommonOptions } from './useCommon.type';

export interface UseRecordOptions<T extends RecordModel> extends UseCommonOptions {
  defaultValue?: T | null;
  requestKey?: string;
}

export type UseRecordResult<T extends RecordModel = RecordModel> = QueryResult<T>;
