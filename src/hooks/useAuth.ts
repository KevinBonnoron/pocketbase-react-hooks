import type { RecordModel } from 'pocketbase';
import { useCallback, useEffect, useState } from 'react';
import type { UseAuthResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useAuth<User extends RecordModel>(): UseAuthResult<User> {
  const pb = usePocketBase();
  const [user, setUser] = useState(pb.authStore.model as User | null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      setUser(pb.authStore.model as User | null);
    });

    return unsubscribe;
  }, [pb]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const authData = await pb.collection('users').authWithPassword(email, password);
        return authData.record as User;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pb],
  );

  const signOut = useCallback(() => {
    pb.authStore.clear();
  }, [pb]);

  const signUp = useCallback(
    async (email: string, password: string, passwordConfirm: string, additionalData?: Record<string, unknown>) => {
      try {
        setIsLoading(true);
        setError(null);
        const record = await pb
          .autoCancellation(false)
          .collection('users')
          .create({
            email,
            password,
            passwordConfirm,
            role: 'user',
            ...additionalData,
          });
        return record as User;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pb],
  );

  const refresh = useCallback(async () => {
    if (!pb.authStore.isValid) {
      const authData = await pb.collection('users').authRefresh();
      setUser(authData.record as User);
    }
  }, [pb]);

  return {
    user,
    signIn,
    signOut,
    signUp,
    isLoading,
    error,
    isAuthenticated: !!user,
    refresh,
  };
}
