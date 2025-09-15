import type { RecordModel, RecordOptions } from 'pocketbase';

/**
 * Result type returned by useUpdateMutation hook.
 *
 * @template Record - The record type extending RecordModel
 */
export interface UseUpdateMutationResult<Record extends RecordModel> {
  /**
   * Function to update an existing record. Returns the updated record on success, null on error.
   *
   * @param id - The ID of the record to update
   * @param bodyParams - Partial record data to update
   * @param options - Optional PocketBase record options (expand, fields, etc.)
   */
  mutate: (id: string, bodyParams: Partial<Record>, options?: RecordOptions) => Promise<Record | null>;

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
