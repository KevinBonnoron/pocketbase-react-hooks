import type { AuthRecord } from 'pocketbase';
import { useCallback, useEffect, useState } from 'react';
import type { UseAuthResult } from '../types';
import { usePocketbase } from './usePocketbase';

export function useAuth<User extends AuthRecord>(): UseAuthResult<User> {
  const pb = usePocketbase();
  const [user, setUser] = useState(pb.authStore.model as User);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      setUser(pb.authStore.model as User);
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
        const record: User = await pb
          .autoCancellation(false)
          .collection('users')
          .create({
            email,
            password,
            passwordConfirm,
            role: 'user',
            ...additionalData,
          });

        setUser(record);
        return record;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pb],
  );

  const update = useCallback(
    async (data: Partial<Omit<User, 'id' | 'created' | 'updated'>>) => {
      if (!user) {
        throw new Error('User not found');
      }

      const record = await pb.collection('users').update(user?.id as string, data);
      return record as User;
    },
    [pb, user],
  );

  const refresh = useCallback(async () => {
    if (!pb.authStore.isValid) {
      const authData = await pb.collection('users').authRefresh();
      setUser(authData.record as User);
    }
  }, [pb]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    signIn,
    signOut,
    signUp,
    update,
    refresh,
  };
}
