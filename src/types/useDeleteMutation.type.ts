import type { CommonOptions } from 'pocketbase';

/**
 * Result type returned by useDeleteMutation hook.
 */
export interface UseDeleteMutationResult {
  /**
   * Function to delete a record. Returns true on success, false on error.
   *
   * @param id - The ID of the record to delete
   * @param options - Optional PocketBase common options (headers, fetch, etc.)
   */
  mutate: (id: string, options?: CommonOptions) => Promise<boolean>;

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
