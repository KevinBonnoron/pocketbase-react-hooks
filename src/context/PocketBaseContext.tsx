import type PocketBase from 'pocketbase';
import { createContext, useContext } from 'react';

export const PocketBaseContext = createContext<PocketBase | null>(null);

export const usePocketBaseContext = (): PocketBase => {
  const context = useContext(PocketBaseContext);
  if (!context) {
    throw new Error('usePocketBaseContext must be used within a PocketBaseProvider');
  }
  return context;
};
