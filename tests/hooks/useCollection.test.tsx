import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import type Pocketbase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCollection } from '../../src/hooks/useCollection';
import { PocketbaseProvider } from '../../src/providers/PocketbaseProvider';

const createMockPocketbase = () => {
  const mockGetFullList = vi.fn();
  const mockSubscribe = vi.fn().mockResolvedValue(() => {});

  return {
    baseURL: 'http://localhost:8090',
    collection: vi.fn().mockReturnValue({
      getFullList: mockGetFullList,
      subscribe: mockSubscribe,
    }),
    authStore: {
      isValid: false,
      model: null,
      onChange: vi.fn(() => () => {}),
    },
  } as unknown as Pocketbase;
};

describe('useCollection', () => {
  let mockPocketbase: Pocketbase;
  let mockGetFullList: any;
  let mockSubscribe: any;

  beforeEach(() => {
    mockPocketbase = createMockPocketbase();
    mockGetFullList = mockPocketbase.collection('test').getFullList;
    mockSubscribe = mockPocketbase.collection('test').subscribe;
  });

  it('should return initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('should fetch collection data', async () => {
    const mockData = [
      { id: '1', title: 'Test 1' },
      { id: '2', title: 'Test 2' },
    ];

    mockGetFullList.mockResolvedValue(mockData);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    // Wait for the effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockGetFullList).toHaveBeenCalledWith({});

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Fetch failed');
    mockGetFullList.mockRejectedValue(mockError);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toEqual('Fetch failed');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBe(null);
  });

  it('should subscribe to real-time updates', async () => {
    const mockData = [{ id: '1', title: 'Test' }];
    mockGetFullList.mockResolvedValue(mockData);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    renderHook(() => useCollection('test'), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockSubscribe).toHaveBeenCalledWith('*', expect.any(Function), {
      expand: undefined,
      filter: undefined,
    });
  });

  it('should use custom options', async () => {
    const mockData: RecordModel[] = [];
    mockGetFullList.mockResolvedValue(mockData);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    renderHook(
      () =>
        useCollection('test', {
          page: 2,
          perPage: 10,
          sort: '-created',
          filter: 'status = "published"',
          expand: 'author',
          fields: 'id,title,content',
        }),
      { wrapper },
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockGetFullList).toHaveBeenCalledWith({
      page: 2,
      perPage: 10,
      sort: '-created',
      filter: 'status = "published"',
      expand: 'author',
      fields: 'id,title,content',
    });
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useCollection('test'));
    }).toThrow('usePocketbase must be used within a PocketbaseProvider');
  });
});
