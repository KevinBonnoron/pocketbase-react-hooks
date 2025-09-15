import type { AuthRecord, OAuth2AuthConfig, RecordOptions } from 'pocketbase';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UseAuthOptions, UseAuthResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useAuth<User extends AuthRecord>({ collectionName = 'users' }: UseAuthOptions = {}): UseAuthResult<User> {
  const pb = usePocketBase();
  const [user, setUser] = useState<User | null>(pb.authStore.record as User);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    return pb.authStore.onChange((token, model) => {
      setUser(model as User);
    });
  }, [pb]);

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

  const signIn = useMemo(
    () => ({
      email: async (email: string, password: string, options?: RecordOptions) => {
        try {
          setIsLoading(true);
          setError(null);
          const authData = await pb.collection(collectionName).authWithPassword(email, password, options);
          return authData.record as User;
        } catch (err) {
          setError(err as Error);
          return null;
        } finally {
          setIsLoading(false);
        }
      },
      social: async (provider: string, options: Omit<OAuth2AuthConfig, 'provider'> = {}) => {
        try {
          setIsLoading(true);
          setError(null);
          const authData = await pb.collection(collectionName).authWithOAuth2({ provider, ...options });
          return authData.record as User;
        } catch (err) {
          setError(err as Error);
          return null;
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [collectionName, pb],
  );

  const signOut = useCallback(() => {
    pb.authStore.clear();
  }, [pb]);

  const signUp = useMemo(
    () => ({
      email: async (email: string, password: string, options: RecordOptions & { additionalData?: Record<string, unknown> } = {}) => {
        try {
          setIsLoading(true);
          setError(null);
          const record: User = await pb.collection(collectionName).create(
            {
              email,
              password,
              ...options.additionalData,
            },
            options,
          );

          return record;
        } catch (err) {
          setError(err as Error);
          return null;
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [collectionName, pb],
  );

  const passwordReset = useMemo(
    () => ({
      request: async (email: string, options?: RecordOptions) => {
        try {
          setIsLoading(true);
          setError(null);
          await pb.collection(collectionName).requestPasswordReset(email, options);
        } catch (err) {
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      },
      confirm: async (passwordResetToken: string, password: string, passwordConfirm: string, options?: RecordOptions) => {
        try {
          setIsLoading(true);
          setError(null);
          await pb.collection(collectionName).confirmPasswordReset(passwordResetToken, password, passwordConfirm, options);
        } catch (err) {
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [collectionName, pb],
  );

  const verification = useMemo(
    () => ({
      request: async (email: string, options?: RecordOptions) => {
        try {
          setIsLoading(true);
          setError(null);
          await pb.collection(collectionName).requestVerification(email, options);
        } catch (err) {
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      },
      confirm: async (verificationToken: string, options?: RecordOptions) => {
        try {
          setIsLoading(true);
          setError(null);
          await pb.collection(collectionName).confirmVerification(verificationToken, options);
        } catch (err) {
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [collectionName, pb],
  );

  return useMemo(
    () => ({
      user,
      isLoading,
      error,
      isAuthenticated: !isLoading && !error && !!user,
      signIn,
      signOut,
      signUp,
      passwordReset,
      verification,
    }),
    [isLoading, user, error, signOut, signIn, signUp, passwordReset, verification],
  );
}
