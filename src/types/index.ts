import type { AuthRecord, RecordModel } from 'pocketbase';
import type { QueryResult } from '../lib/utils';

export interface UseCollectionOptions<T extends RecordModel> {
  filter?: string;
  sort?: string;
  expand?: string;
  fields?: string;
  page?: number;
  perPage?: number;
  defaultValue?: T[];
}

export type UseCollectionResult<T extends RecordModel> = QueryResult<T[]>;

export interface UseRecordOptions<T extends RecordModel> {
  expand?: string;
  fields?: string;
  defaultValue?: T | null;
}

export type UseRecordResult<T extends RecordModel = RecordModel> = QueryResult<T>;

export interface UseMutationResult<Record extends RecordModel> {
  create: (data: Partial<Record>) => Promise<Record | null>;
  update: (id: string, data: Partial<Record>) => Promise<Record | null>;
  remove: (id: string) => Promise<boolean>;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: string | null;
}

export interface UseAuthOptions {
  collectionName?: string;
}

export interface UseAuthResult<User extends AuthRecord> {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  signIn: {
    email: (email: string, password: string) => Promise<User | null>;
    social: (provider: string) => Promise<User | null>;
  };
  signUp: {
    email: (email: string, password: string, data?: Record<string, unknown>) => Promise<User | null>;
  };
  signOut: () => void;
}
