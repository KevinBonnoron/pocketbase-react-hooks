import type { RecordModel } from 'pocketbase';
import type { QueryResult } from './query-result.type';
import type { UseCommonOptions } from './useCommon.type';

/**
 * Options for configuring the useCollection hook.
 *
 * @template T - The record type extending RecordModel
 */
export interface UseCollectionOptions<T extends RecordModel> extends UseCommonOptions {
  /**
   * PocketBase filter query (e.g., 'published = true')
   */
  filter?: string;

  /**
   * Sort criteria (e.g., '-created' for descending, 'name,created' for multiple)
   */
  sort?: string;

  /**
   * Page number for pagination (used with perPage)
   */
  page?: number;

  /**
   * Number of items per page (default: 20 when fetchAll is false)
   */
  perPage?: number;

  /**
   * Default value to use before data is loaded
   */
  defaultValue?: T[];

  /**
   * Enable or disable data fetching (default: true)
   */
  enabled?: boolean;

  /**
   * Fetch all records using getFullList() instead of paginated getList() (default: true)
   */
  fetchAll?: boolean;
}

/**
 * Result type returned by useCollection hook.
 *
 * @template T - The record type extending RecordModel
 */
export type UseCollectionResult<T extends RecordModel> = QueryResult<T[]>;
