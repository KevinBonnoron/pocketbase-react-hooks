import type Pocketbase from 'pocketbase';
import { createContext, useContext } from 'react';

export const PocketbaseContext = createContext<Pocketbase | null>(null);

export const usePocketbaseContext = (): Pocketbase => {
  const context = useContext(PocketbaseContext);
  if (!context) {
    throw new Error('usePocketbaseContext must be used within a PocketbaseProvider');
  }
  return context;
};
