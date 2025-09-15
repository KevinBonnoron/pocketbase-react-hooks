import type { AuthRecord } from 'pocketbase';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UseAuthResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useAuth<User extends AuthRecord>(): UseAuthResult<User> {
  const pb = usePocketBase();
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
        setError(new Error('User not found'));
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const record = await pb.collection('users').update(user.id, data);
        setUser(record as User);
        return record as User;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pb, user],
  );

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!pb.authStore.isValid) {
        const authData = await pb.collection('users').authRefresh();
        setUser(authData.record as User);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [pb]);

  return useMemo(() => {
    if (isLoading) {
      return {
        user,
        isLoading,
        error,
        isAuthenticated: false,
        signIn,
        signOut,
        signUp,
        update,
        refresh,
      };
    }

    if (error) {
      return {
        user,
        isLoading,
        error,
        isAuthenticated: false,
        signIn,
        signOut,
        signUp,
        update,
        refresh,
      };
    }

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
  }, [isLoading, user, error, signIn, signOut, signUp, update, refresh]);
}
