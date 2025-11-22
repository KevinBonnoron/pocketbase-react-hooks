import type { AuthRecord, OAuth2AuthConfig, RecordModel, RecordOptions } from 'pocketbase';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthCollectionRecord, UseAuthOptions, UseAuthResult } from '../types';
import { usePocketBase } from './usePocketBase';

export function useAuth<TDatabase extends Record<string, RecordModel>, TCollection extends keyof TDatabase & string = 'users'>(options?: UseAuthOptions): UseAuthResult<AuthCollectionRecord<TDatabase, TCollection>>;

export function useAuth<TUser extends AuthRecord>(options?: UseAuthOptions): UseAuthResult<TUser>;

/**
 * Hook for managing PocketBase authentication.
 *
 * Provides methods for sign in (email, social OAuth2, OTP), sign up, sign out,
 * password reset, email verification, and OTP requests. Automatically syncs with
 * PocketBase authStore and subscribes to real-time user record updates.
 *
 * @template TDatabase - The database schema (inferred from PocketBaseProvider)
 * @template TCollection - The auth collection name (must be a key in TDatabase)
 * @template TUser - The user record type (used when providing explicit type)
 * @param options - Configuration options
 * @param options.collectionName - The authentication collection name (default: 'users')
 * @param options.realtime - Enable real-time updates (default: true)
 * @returns Authentication state and methods
 *
 * @example Basic usage with explicit type
 * ```tsx
 * const { user, signIn, signOut } = useAuth<User>();
 * ```
 *
 * @example With typed database schema (auto-inferred from PocketBaseProvider)
 * ```tsx
 * // Types are automatically inferred from Database schema
 * const { user } = useAuth(); // user: UsersResponse | null
 * const { user } = useAuth({ collectionName: 'admins' }); // user: AdminsResponse | null
 * ```
 */
export function useAuth<TUser extends AuthRecord>({ collectionName = 'users', realtime = true }: UseAuthOptions = {}): UseAuthResult<TUser> {
  const pb = usePocketBase();
  const [user, setUser] = useState<TUser | null>(pb.authStore.record as TUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const recordService = useMemo(() => pb.collection(collectionName), [pb, collectionName]);

  useEffect(() => {
    return pb.authStore.onChange((_, model) => {
      setUser(model as TUser);
    });
  }, [pb]);

  useEffect(() => {
    if (!user || !realtime) {
      return;
    }

    const unsubscribe = recordService.subscribe(user.id, (e) => {
      if (e.action === 'update') {
        setUser(e.record as TUser);
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
          return authData.record as TUser;
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
          return authData.record as TUser;
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
          return authData.record as TUser;
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
      email: async (email: string, password: string, options: RecordOptions & { additionalData?: Record<string, unknown>; autoLogin?: boolean } = {}) => {
        try {
          setIsLoading(true);
          setError(null);
          const { additionalData, autoLogin = false, ...rest } = options;
          const record: TUser = await recordService.create(
            {
              email,
              password,
              passwordConfirm: password,
              ...additionalData,
            },
            rest,
          );

          if (record && autoLogin) {
            setUser(record);
          }

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
    const authData = await recordService.authRefresh<TUser>();
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
