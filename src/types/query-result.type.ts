type LoadingQueryResult = { isLoading: true; isSuccess: false; isError: false; error: null; data: null };
type SuccessQueryResult<T> = { isLoading: false; isSuccess: true; isError: false; error: null; data: T };
type ErrorQueryResult = { isLoading: false; isSuccess: false; isError: true; error: string; data: null };

export type QueryResult<T> = LoadingQueryResult | SuccessQueryResult<T> | ErrorQueryResult;
