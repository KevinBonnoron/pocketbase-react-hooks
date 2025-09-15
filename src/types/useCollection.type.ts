import type { RecordModel } from 'pocketbase';
import type { QueryResult } from './query-result.type';
import type { UseCommonOptions } from './useCommon.type';

export interface UseCollectionOptions<T extends RecordModel> extends UseCommonOptions {
  filter?: string;
  sort?: string;
  page?: number;
  perPage?: number;
  defaultValue?: T[];
  enabled?: boolean;
  fetchAll?: boolean;
  subscribe?: boolean;
  requestKey?: string;
}

export type UseCollectionResult<T extends RecordModel> = QueryResult<T[]>;
