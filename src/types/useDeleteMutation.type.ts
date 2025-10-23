import type { CommonOptions } from 'pocketbase';

/**
 * Result type returned by useDeleteMutation hook.
 */
export interface UseDeleteMutationResult {
  /**
   * Function to delete a record synchronously. Triggers the mutation but doesn't wait for completion.
   *
   * @param options - Optional PocketBase common options (headers, fetch, etc.)
   */
  mutate: (options?: CommonOptions) => void;

  /**
   * Function to delete a record asynchronously. Returns a promise that resolves when deletion is complete.
   *
   * @param options - Optional PocketBase common options (headers, fetch, etc.)
   */
  mutateAsync: (options?: CommonOptions) => Promise<void>;

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
