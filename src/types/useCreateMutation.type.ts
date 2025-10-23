import type { RecordModel, RecordOptions } from 'pocketbase';
import type { UseMutationCommonOptions } from './useMutationCommon.type';

/**
 * Result type returned by useCreateMutation hook.
 *
 * @template Record - The record type extending RecordModel
 */
export interface UseCreateMutationResult<Record extends RecordModel> extends UseMutationCommonOptions {
  /**
   * Function to create a new record synchronously. Triggers the mutation but doesn't wait for completion.
   *
   * @param bodyParams - Partial record data to create
   * @param options - Optional PocketBase record options (expand, fields, etc.)
   */
  mutate: (bodyParams: Partial<Record>, options?: RecordOptions) => void;

  /**
   * Function to create a new record asynchronously. Returns a promise that resolves with the created record.
   *
   * @param bodyParams - Partial record data to create
   * @param options - Optional PocketBase record options (expand, fields, etc.)
   */
  mutateAsync: (bodyParams: Partial<Record>, options?: RecordOptions) => Promise<Record>;
}
