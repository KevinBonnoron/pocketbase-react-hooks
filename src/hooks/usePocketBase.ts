import type PocketBase from 'pocketbase';
import { useContext } from 'react';
import { PocketBaseContext } from '../context';

/**
 * Hook for accessing the PocketBase client instance.
 *
 * Returns the PocketBase instance from context. Must be used within a PocketBaseProvider.
 * Use this when you need direct access to the PocketBase SDK for custom operations.
 *
 * @returns The PocketBase client instance
 * @throws Error if used outside of PocketBaseProvider
 *
 * @example
 * ```tsx
 * const pb = usePocketBase();
 *
 * const customOperation = async () => {
 *   const result = await pb.collection('custom').getList();
 *   return result;
 * };
 * ```
 */
export function usePocketBase(): PocketBase {
  const pb = useContext(PocketBaseContext);
  if (!pb) {
    throw new Error('usePocketBase must be used within a PocketBaseProvider');
  }

  return pb;
}
