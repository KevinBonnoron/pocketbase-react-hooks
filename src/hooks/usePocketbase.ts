import type Pocketbase from 'pocketbase';
import { useContext } from 'react';
import { PocketbaseContext } from '../context';

export function usePocketbase(): Pocketbase {
  const pb = useContext(PocketbaseContext);
  if (!pb) {
    throw new Error('usePocketbase must be used within a PocketbaseProvider');
  }

  return pb;
}
