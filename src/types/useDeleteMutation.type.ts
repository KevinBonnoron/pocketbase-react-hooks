import type { CommonOptions } from 'pocketbase';
import type { UseMutationCommonOptions } from './useMutationCommon.type';

/**
 * Result type returned by useDeleteMutation hook.
 */
export interface UseDeleteMutationResult extends UseMutationCommonOptions {
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
}
