import type PocketBase from 'pocketbase';
import type { AuthRecord, RecordModel } from 'pocketbase';

export type DefaultDatabase = Record<string, RecordModel>;

export type TypedPocketBase<TDatabase extends Record<string, RecordModel> = DefaultDatabase> = PocketBase & {
  __database?: TDatabase;
};

export type ExtractDatabase<T> = T extends TypedPocketBase<infer TDatabase> ? TDatabase : DefaultDatabase;

export type CollectionRecord<TDatabase extends Record<string, RecordModel>, TCollection extends keyof TDatabase> = TDatabase[TCollection];

export type AuthCollectionRecord<TDatabase extends Record<string, RecordModel>, TCollection extends keyof TDatabase> = TDatabase[TCollection] extends AuthRecord ? TDatabase[TCollection] : AuthRecord;
