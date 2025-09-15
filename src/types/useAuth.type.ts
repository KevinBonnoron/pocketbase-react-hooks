import type { AuthRecord, OAuth2AuthConfig, RecordOptions } from 'pocketbase';
import type { AuthProvider } from './auth-provider.type';

export interface UseAuthOptions {
  collectionName?: string;
}

export interface UseAuthResult<User extends AuthRecord> {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  signIn: {
    email: (email: string, password: string, options?: RecordOptions) => Promise<User | null>;
    social: (provider: AuthProvider, options?: Omit<OAuth2AuthConfig, 'provider'>) => Promise<User | null>;
  };
  signUp: {
    email: (email: string, password: string, options?: RecordOptions & { additionalData?: Record<string, unknown> }) => Promise<User | null>;
  };
  signOut: () => void;
  passwordReset: {
    request: (email: string, options?: RecordOptions) => Promise<void>;
    confirm: (passwordResetToken: string, password: string, passwordConfirm: string, options?: RecordOptions) => Promise<void>;
  };
  verification: {
    request: (email: string, options?: RecordOptions) => Promise<void>;
    confirm: (verificationToken: string, options?: RecordOptions) => Promise<void>;
  };
}
