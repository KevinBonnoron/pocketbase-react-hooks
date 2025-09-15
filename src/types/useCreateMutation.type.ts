import type { RecordModel, RecordOptions } from 'pocketbase';

/**
 * Result type returned by useCreateMutation hook.
 *
 * @template Record - The record type extending RecordModel
 */
export interface UseCreateMutationResult<Record extends RecordModel> {
  /**
   * Function to create a new record. Returns the created record on success, null on error.
   *
   * @param bodyParams - Partial record data to create
   * @param options - Optional PocketBase record options (expand, fields, etc.)
   */
  mutate: (bodyParams: Partial<Record>, options?: RecordOptions) => Promise<Record | null>;

  /**
   * True when the mutation is in progress
   */
  isPending: boolean;

  /**
   * True when the mutation completed successfully (not pending and no error)
   */
  isSuccess: boolean;

  /**
   * Error message if the mutation failed, null otherwise
   */
  error: string | null;
}
