import type PocketBase from 'pocketbase';
import { type Context, createContext, useContext } from 'react';

/**
 * React Context for providing PocketBase client instance.
 * Used internally by PocketBaseProvider.
 *
 * @internal
 */
export const PocketBaseContext: Context<PocketBase | null> = createContext<PocketBase | null>(null);

/**
 * Hook for accessing the PocketBase client instance from context.
 *
 * @returns The PocketBase client instance
 * @throws Error if used outside of PocketBaseProvider
 *
 * @example
 * ```tsx
 * const pb = usePocketBaseContext();
 * const posts = await pb.collection('posts').getList();
 * ```
 *
 * @deprecated Use `usePocketBase()` instead. This export is kept for backward compatibility.
 */
export const usePocketBaseContext = (): PocketBase => {
  const context = useContext(PocketBaseContext);
  if (!context) {
    throw new Error('usePocketBaseContext must be used within a PocketBaseProvider');
  }
  return context;
};
