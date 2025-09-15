import type PocketBase from 'pocketbase';
import { useContext } from 'react';
import { PocketBaseContext } from '../context';

export function usePocketBase(): PocketBase {
  const pb = useContext(PocketBaseContext);
  if (!pb) {
    throw new Error('usePocketBase must be used within a PocketBaseProvider');
  }

  return pb;
}
