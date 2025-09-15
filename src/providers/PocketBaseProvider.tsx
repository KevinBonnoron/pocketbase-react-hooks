import type PocketBase from 'pocketbase';
import type { ReactElement, ReactNode } from 'react';
import { PocketBaseContext } from '../context';

/**
 * Props for the PocketBaseProvider component.
 */
interface PocketBaseProviderProps {
  /**
   * React children to render
   */
  children: ReactNode;

  /**
   * PocketBase client instance
   */
  pocketBase: InstanceType<typeof PocketBase>;
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
 */
export function PocketBaseProvider({ children, pocketBase }: PocketBaseProviderProps): ReactElement {
  return <PocketBaseContext.Provider value={pocketBase}>{children}</PocketBaseContext.Provider>;
}
