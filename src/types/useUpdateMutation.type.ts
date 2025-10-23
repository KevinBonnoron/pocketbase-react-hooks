import type { RecordModel, RecordOptions } from 'pocketbase';
import type { UseMutationCommonOptions } from './useMutationCommon.type';

/**
 * Result type returned by useUpdateMutation hook.
 *
 * @template Record - The record type extending RecordModel
 */
export interface UseUpdateMutationResult<Record extends RecordModel> extends UseMutationCommonOptions {
  /**
   * Function to update an existing record synchronously. Triggers the mutation but doesn't wait for completion.
   *
   * @param bodyParams - Partial record data to update
   * @param options - Optional PocketBase record options (expand, fields, etc.)
   */
  mutate: (bodyParams: Partial<Record>, options?: RecordOptions) => void;

  /**
   * Function to update an existing record asynchronously. Returns a promise that resolves with the updated record.
   *
   * @param bodyParams - Partial record data to update
   * @param options - Optional PocketBase record options (expand, fields, etc.)
   */
  mutateAsync: (bodyParams: Partial<Record>, options?: RecordOptions) => Promise<Record>;
}
