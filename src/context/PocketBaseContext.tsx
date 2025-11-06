import type { RecordModel } from 'pocketbase';
import type PocketBase from 'pocketbase';
import { type Context, createContext, useContext } from 'react';
import type { DefaultDatabase, TypedPocketBase } from '../types';

/**
 * React Context for providing PocketBase client instance.
 * Used internally by PocketBaseProvider.
 *
 * @internal
 */
export const PocketBaseContext: Context<TypedPocketBase<any> | null> = createContext<TypedPocketBase<any> | null>(null);

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
export const usePocketBaseContext = <TDatabase extends Record<string, RecordModel> = DefaultDatabase>(): TypedPocketBase<TDatabase> => {
  const context = useContext(PocketBaseContext);
  if (!context) {
    throw new Error('usePocketBaseContext must be used within a PocketBaseProvider');
  }
  return context as TypedPocketBase<TDatabase>;
};
