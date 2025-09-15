import type { RecordModel } from 'pocketbase';

type LoadingQueryResult = { isLoading: true; isSuccess: false; isError: false; error: null; data: null };
type SuccessQueryResult<T> = { isLoading: false; isSuccess: true; isError: false; error: null; data: T };
type ErrorQueryResult = { isLoading: false; isSuccess: false; isError: true; error: string; data: null };

export type QueryResult<T> = LoadingQueryResult | SuccessQueryResult<T> | ErrorQueryResult;

export function createQueryResult<T>(isLoading: boolean, error: string | null, data: T | null): QueryResult<T> {
  if (isLoading) {
    return {
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
    } as const satisfies LoadingQueryResult;
  }

  if (error) {
    return {
      isLoading: false,
      isSuccess: false,
      isError: true,
      error,
      data: null,
    } as const satisfies ErrorQueryResult;
  }

  return {
    isLoading: false,
    isSuccess: true,
    isError: false,
    error: null,
    data: data as T,
  } as const satisfies SuccessQueryResult<T>;
}

export function sortRecords<T extends RecordModel>(records: T[], sortString: string): T[] {
  const [direction, field] = sortString.startsWith('-') ? ['desc', sortString.slice(1)] : ['asc', sortString.startsWith('+') ? sortString.slice(1) : sortString];

  return records.sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[field];
    const bVal = (b as Record<string, unknown>)[field];

    // Gérer les comparaisons de types différents
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    }

    // Comparaison par défaut
    const aStr = String(aVal);
    const bStr = String(bVal);
    if (aStr < bStr) return direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}
