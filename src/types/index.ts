import type { AuthRecord, OAuth2AuthConfig, RecordModel, RecordOptions } from 'pocketbase';
import type { QueryResult } from '../lib/utils';

export interface UseCollectionOptions<T extends RecordModel> {
  filter?: string;
  sort?: string;
  expand?: string;
  fields?: string;
  page?: number;
  perPage?: number;
  defaultValue?: T[];
  enabled?: boolean;
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

type Provider =
  | 'apple'
  | 'microsoft'
  | 'google'
  | 'yandex'
  | 'facebook'
  | 'instagram'
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'gitea'
  | 'gitee'
  | 'discord'
  | 'twitter'
  | 'kaboo'
  | 'vk'
  | 'linear'
  | 'notion'
  | 'monday'
  | 'box'
  | 'spotify'
  | 'trakt'
  | 'twitch'
  | 'patreon'
  | 'strava'
  | 'wokatime'
  | 'livechat'
  | 'mailcow'
  | 'planningcenter'
  | 'oidc'
  | 'oidc2'
  | 'oidc3'
  | (string & {});

export interface UseAuthResult<User extends AuthRecord> {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  signIn: {
    email: (email: string, password: string, options?: RecordOptions) => Promise<User | null>;
    social: (provider: Provider, options?: Omit<OAuth2AuthConfig, 'provider'>) => Promise<User | null>;
  };
  signUp: {
    email: (email: string, password: string, options?: RecordOptions & { additionalData?: Record<string, unknown> }) => Promise<User | null>;
  };
  signOut: () => void;
}
