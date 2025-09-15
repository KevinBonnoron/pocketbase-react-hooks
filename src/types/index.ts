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

export interface UseRecordOptions<T extends RecordModel = RecordModel> {
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

export interface UseAuthResult<User extends AuthRecord> {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, passwordConfirm: string, data?: Record<string, unknown>) => Promise<User | null>;
  signOut: () => void;
  refresh: () => Promise<void>;
  update: (data: Partial<Omit<User, 'id' | 'created' | 'updated'>>) => Promise<User | null>;
}
