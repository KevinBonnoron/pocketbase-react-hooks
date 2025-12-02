type QueryState<T> = {
  promise: Promise<T> | null;
  data: T | undefined;
  error: Error | null;
  subscribers: Set<(data: T) => void>;
};

class QueryCache {
  private cache = new Map<string, QueryState<unknown>>();

  private getOrCreateState<T>(key: string): QueryState<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, {
        promise: null,
        data: undefined,
        error: null,
        subscribers: new Set(),
      });
    }
    return this.cache.get(key) as QueryState<T>;
  }

  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    const state = this.getOrCreateState<T>(key);
    state.subscribers.add(callback);

    return () => {
      state.subscribers.delete(callback);
      if (state.subscribers.size === 0 && !state.promise) {
        this.cache.delete(key);
      }
    };
  }

  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const state = this.getOrCreateState<T>(key);

    if (state.promise) {
      return state.promise;
    }

    const promise = fetcher()
      .then((data) => {
        state.data = data;
        state.error = null;
        state.promise = null;
        state.subscribers.forEach((callback) => {
          callback(data);
        });
        return data;
      })
      .catch((error) => {
        state.error = error;
        state.promise = null;
        throw error;
      });

    state.promise = promise;
    return promise;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const queryCache = new QueryCache();
