import type { AuthRecord, RecordModel } from 'pocketbase';
import type PocketBase from 'pocketbase';

export type DefaultDatabase = Record<string, RecordModel>;

export type TypedPocketBase<TDatabase = DefaultDatabase> = PocketBase & {
  __database?: TDatabase;
};

export type ExtractDatabase<T> = T extends TypedPocketBase<infer TDatabase> ? TDatabase : DefaultDatabase;

export type CollectionRecord<TDatabase, TCollection extends keyof TDatabase> = TDatabase[TCollection];

export type AuthCollectionRecord<TDatabase, TCollection extends keyof TDatabase> = TDatabase[TCollection] extends AuthRecord
  ? TDatabase[TCollection]
  : AuthRecord;
