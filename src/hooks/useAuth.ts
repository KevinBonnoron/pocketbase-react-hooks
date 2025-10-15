import type { AuthRecord, OAuth2AuthConfig, RecordOptions } from 'pocketbase';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UseAuthOptions, UseAuthResult } from '../types';
import { usePocketBase } from './usePocketBase';

/**
 * Hook for managing PocketBase authentication.
 *
 * Provides methods for sign in (email, social OAuth2, OTP), sign up, sign out,
 * password reset, email verification, and OTP requests. Automatically syncs with
 * PocketBase authStore and subscribes to real-time user record updates.
 *
 * @template User - The user record type extending AuthRecord
 * @param options - Configuration options
 * @param options.collectionName - The authentication collection name (default: 'users')
 * @returns Authentication state and methods
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, signIn, signOut, signUp } = useAuth<User>();
 *
 * const handleLogin = async () => {
 *   const user = await signIn.email('user@example.com', 'password');
 *   if (user) console.log('Signed in:', user);
 * };
 *
 * const handleRegister = async () => {
 *   const user = await signUp.email('user@example.com', 'password');
 *   if (user) console.log('Registered:', user);
 * };
 * ```
 */
export function useAuth<User extends AuthRecord>({ collectionName = 'users', realtime = true }: UseAuthOptions = {}): UseAuthResult<User> {
  const pb = usePocketBase();
  const [user, setUser] = useState<User | null>(pb.authStore.record as User);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);

  useEffect(() => {
    return pb.authStore.onChange((_, model) => {
      setUser(model as User);
    });
  }, [pb]);

  useEffect(() => {
    if (!user || !realtime) {
      return;
    }

    const unsubscribe = recordService.subscribe(user.id, (e) => {
      if (e.action === 'update') {
        setUser(e.record as User);
      } else if (e.action === 'delete') {
        setUser(null);
      }
    });

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [user, recordService, realtime]);

  const signIn = useMemo(
    () => ({
      email: async (email: string, password: string, options?: RecordOptions) => {
        try {
          setIsLoading(true);
          setError(null);
          const authData = await recordService.authWithPassword(email, password, options);
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
          const authData = await recordService.authWithOAuth2({ provider, ...options });
          return authData.record as User;
        } catch (err) {
          setError(err as Error);
          return null;
        } finally {
          setIsLoading(false);
        }
      },
      otp: async (otp: string, password: string, options?: RecordOptions) => {
        try {
          setIsLoading(true);
          setError(null);
          const authData = await recordService.authWithOTP(otp, password, options);
          return authData.record as User;
        } catch (err) {
          setError(err as Error);
          return null;
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [recordService],
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
          const { additionalData, ...rest } = options;
          const record: User = await recordService.create(
            {
              email,
              password,
              ...additionalData,
            },
            rest,
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
    [recordService],
  );

  const refreshAuth = useCallback(async () => {
    const authData = await recordService.authRefresh<User>();
    setUser(authData.record);
  }, [recordService]);

  const passwordReset = useMemo(
    () => ({
      request: async (email: string, options?: RecordOptions) => {
        try {
          setIsLoading(true);
          setError(null);
          await recordService.requestPasswordReset(email, options);
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
          await recordService.confirmPasswordReset(passwordResetToken, password, passwordConfirm, options);
        } catch (err) {
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [recordService],
  );

  const verification = useMemo(
    () => ({
      request: async (email: string, options?: RecordOptions) => {
        try {
          setIsLoading(true);
          setError(null);
          await recordService.requestVerification(email, options);
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
          await recordService.confirmVerification(verificationToken, options);
        } catch (err) {
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [recordService],
  );

  const requestOTP = useCallback(
    async (email: string, options?: RecordOptions) => {
      await recordService.requestOTP(email, options);
    },
    [recordService],
  );

  return useMemo(
    () => ({
      user,
      token: pb.authStore.token,
      isLoading,
      error,
      isAuthenticated: !isLoading && !error && !!user,
      signIn,
      signOut,
      signUp,
      refreshAuth,
      passwordReset,
      verification,
      requestOTP,
    }),
    [user, pb.authStore.token, isLoading, error, signIn, signOut, signUp, refreshAuth, passwordReset, verification, requestOTP],
  );
}
