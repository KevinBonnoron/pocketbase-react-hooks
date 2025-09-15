import type { AuthRecord } from 'pocketbase';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UseAuthOptions, UseAuthResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useAuth<User extends AuthRecord>({ collectionName = 'users' }: UseAuthOptions = {}): UseAuthResult<User> {
  const pb = usePocketBase();
  const [user, setUser] = useState<User | null>(pb.authStore.record as User);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = pb.collection(collectionName).subscribe(user.id, (e) => {
      if (e.action === 'update') {
        setUser(e.record as User);
      } else if (e.action === 'delete') {
        setUser(null);
      }
    });

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [pb, user, collectionName]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const authData = await pb.collection(collectionName).authWithPassword(email, password);
        return authData.record as User;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pb, collectionName],
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
          .collection(collectionName)
          .create({
            email,
            password,
            passwordConfirm,
            role: 'user',
            ...additionalData,
          });

        return record;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pb, collectionName],
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
        const record = await pb.collection(collectionName).update(user.id, data);
        return record as User;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pb, user, collectionName],
  );

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
    };
  }, [isLoading, user, error, signIn, signOut, signUp, update]);
}
