import type { RecordModel } from 'pocketbase';
import type PocketBase from 'pocketbase';
import type { ReactElement, ReactNode } from 'react';
import { PocketBaseContext } from '../context';
import type { DefaultDatabase, TypedPocketBase } from '../types';

/**
 * Props for the PocketBaseProvider component.
 */
interface PocketBaseProviderProps<TDatabase = DefaultDatabase> {
  /**
   * React children to render
   */
  children: ReactNode;

  /**
   * PocketBase client instance
   */
  pocketBase: PocketBase | TypedPocketBase<TDatabase>;
}

/**
 * Provider component that makes the PocketBase client instance available
 * to all child components through React Context.
 *
 * Must wrap your entire app or the part that needs PocketBase access.
 *
 * @example
 * ```tsx
 * import PocketBase from 'pocketbase';
 * import { PocketBaseProvider } from 'pocketbase-react-hooks';
 *
 * const pb = new PocketBase('http://127.0.0.1:8090');
 *
 * function App() {
 *   return (
 *     <PocketBaseProvider pocketBase={pb}>
 *       <YourApp />
 *     </PocketBaseProvider>
 *   );
 * }
 * ```
 *
 * @example With typed database schema (for pocketbase-typegen)
 * ```tsx
 * import PocketBase from 'pocketbase';
 * import { PocketBaseProvider, type TypedPocketBase } from 'pocketbase-react-hooks';
 * import type { Database } from './pocketbase-types';
 *
 * const pb = new PocketBase('http://127.0.0.1:8090') as TypedPocketBase<Database>;
 *
 * function App() {
 *   return (
 *     <PocketBaseProvider<Database> pocketBase={pb}>
 *       <YourApp />
 *     </PocketBaseProvider>
 *   );
 * }
 * ```
 */
export function PocketBaseProvider<TDatabase = DefaultDatabase>({ children, pocketBase }: PocketBaseProviderProps<TDatabase>): ReactElement {
  return <PocketBaseContext.Provider value={pocketBase as TypedPocketBase<TDatabase>}>{children}</PocketBaseContext.Provider>;
}
