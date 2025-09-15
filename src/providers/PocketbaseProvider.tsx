import type Pocketbase from 'pocketbase';
import type { ReactNode } from 'react';
import { PocketbaseContext } from '../context';

interface PocketbaseProviderProps {
  children: ReactNode;
  pocketBase: InstanceType<typeof Pocketbase>;
}

export function PocketbaseProvider({ children, pocketBase }: PocketbaseProviderProps) {
  return <PocketbaseContext.Provider value={pocketBase}>{children}</PocketbaseContext.Provider>;
}
