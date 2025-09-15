import type PocketBase from 'pocketbase';
import type { ReactNode } from 'react';
import { PocketBaseContext } from '../context';

interface PocketBaseProviderProps {
  children: ReactNode;
  pocketBase: PocketBase;
}

export function PocketBaseProvider({ children, pocketBase }: PocketBaseProviderProps) {
  return <PocketBaseContext.Provider value={pocketBase}>{children}</PocketBaseContext.Provider>;
}
