export interface UseMutationCommonOptions {
  /**
   * True when the mutation is in progress
   */
  isPending: boolean;

  /**
   * True when the mutation completed successfully (not pending and no error)
   */
  isSuccess: boolean;

  /**
   * True when the mutation failed
   */
  isError: boolean;

  /**
   * Error message if the mutation failed, null otherwise
   */
  error: string | null;
}
