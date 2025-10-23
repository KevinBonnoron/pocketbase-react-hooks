import type { RecordModel, RecordOptions } from 'pocketbase';

/**
 * Result type returned by useUpdateMutation hook.
 *
 * @template Record - The record type extending RecordModel
 */
export interface UseUpdateMutationResult<Record extends RecordModel> {
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
