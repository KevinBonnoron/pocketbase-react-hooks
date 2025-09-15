import type { CommonOptions, RecordModel, RecordOptions } from 'pocketbase';

export interface UseMutationResult<Record extends RecordModel> {
  create: (bodyParams: Partial<Record>, options?: RecordOptions) => Promise<Record | null>;
  update: (id: string, bodyParams: Partial<Record>, options?: RecordOptions) => Promise<Record | null>;
  remove: (id: string, options?: CommonOptions) => Promise<boolean>;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: string | null;
}
