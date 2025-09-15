/**
 * Represents a query in loading state.
 */
type LoadingQueryResult = { isLoading: true; isSuccess: false; isError: false; error: null; data: null };

/**
 * Represents a successful query result.
 *
 * @template T - The data type returned by the query
 */
type SuccessQueryResult<T> = { isLoading: false; isSuccess: true; isError: false; error: null; data: T };

/**
 * Represents a failed query result.
 */
type ErrorQueryResult = { isLoading: false; isSuccess: false; isError: true; error: string; data: null };

/**
 * Discriminated union type for query results.
 * Provides type-safe state handling for loading, success, and error states.
 *
 * @template T - The data type returned by the query
 *
 * @example
 * ```tsx
 * const result: QueryResult<Post[]> = useCollection('posts');
 *
 * if (result.isLoading) {
 *   return <div>Loading...</div>;
 * }
 *
 * if (result.isError) {
 *   return <div>Error: {result.error}</div>;
 * }
 *
 * return <div>{result.data.map(post => ...)}</div>;
 * ```
 */
export type QueryResult<T> = LoadingQueryResult | SuccessQueryResult<T> | ErrorQueryResult;
