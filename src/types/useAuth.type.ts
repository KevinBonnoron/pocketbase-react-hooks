import type { AuthRecord, OAuth2AuthConfig, RecordOptions } from 'pocketbase';
import type { AuthProvider } from './auth-provider.type';

/**
 * Options for configuring the useAuth hook.
 */
export interface UseAuthOptions {
  /**
   * The name of the authentication collection (default: 'users')
   */
  collectionName?: string;
}

/**
 * Result type returned by useAuth hook.
 *
 * @template User - The user record type extending AuthRecord
 */
export interface UseAuthResult<User extends AuthRecord> {
  /**
   * The currently authenticated user, or null if not authenticated
   */
  user: User | null;

  /**
   * The current authentication token, or null if not authenticated
   */
  token: string | null;

  /**
   * True if a user is authenticated and not loading
   */
  isAuthenticated: boolean;

  /**
   * True when authentication operations are in progress
   */
  isLoading: boolean;

  /**
   * Error from authentication operations, if any
   */
  error: Error | null;

  /**
   * Methods for signing in users
   */
  signIn: {
    /**
     * Sign in with email and password
     */
    email: (email: string, password: string, options?: RecordOptions) => Promise<User | null>;

    /**
     * Sign in with OAuth2 social provider
     */
    social: (provider: AuthProvider, options?: Omit<OAuth2AuthConfig, 'provider'>) => Promise<User | null>;

    /**
     * Sign in with OTP
     */
    otp: (otp: string, password: string, options?: RecordOptions) => Promise<User | null>;
  };

  /**
   * Methods for signing up new users
   */
  signUp: {
    /**
     * Sign up with email and password
     */
    email: (email: string, password: string, options?: RecordOptions & { additionalData?: Record<string, unknown> }) => Promise<User | null>;
  };

  /**
   * Sign out the current user and clear the auth store
   */
  signOut: () => void;

  /**
   * Refresh the authentication token
   */
  refreshAuth: () => Promise<void>;

  /**
   * Methods for password reset flow
   */
  passwordReset: {
    /**
     * Request a password reset email
     */
    request: (email: string, options?: RecordOptions) => Promise<void>;

    /**
     * Confirm password reset with token
     */
    confirm: (passwordResetToken: string, password: string, passwordConfirm: string, options?: RecordOptions) => Promise<void>;
  };

  /**
   * Methods for email verification flow
   */
  verification: {
    /**
     * Request a verification email
     */
    request: (email: string, options?: RecordOptions) => Promise<void>;

    /**
     * Confirm email verification with token
     */
    confirm: (verificationToken: string, options?: RecordOptions) => Promise<void>;
  };

  /**
   * Request an OTP for email verification
   */
  requestOTP: (email: string, options?: RecordOptions) => Promise<void>;
}
