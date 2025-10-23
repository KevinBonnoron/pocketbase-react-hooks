import type { RecordModel } from 'pocketbase';
import type { RecordTransformer } from './record-transformer.type';

export interface UseQueryCommonOptions<T extends RecordModel> {
  /**
   * Expand related records (e.g., 'author,comments')
   */
  expand?: string;

  /**
   * Select specific fields (e.g., 'name,email')
   */
  fields?: string;

  /**
   * Transformers to apply to the data
   */
  transformers?: RecordTransformer<T>[];
}
