import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCollection } from '../../src/hooks/useCollection';
import { PocketBaseProvider } from '../../src/providers/PocketBaseProvider';

const createMockPocketBase = () => {
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
  } as unknown as PocketBase;
};

describe('useCollection', () => {
  let mockPocketBase: PocketBase;
  let mockGetFullList: any;
  let mockSubscribe: any;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
    mockGetFullList = mockPocketBase.collection('test').getFullList;
    mockSubscribe = mockPocketBase.collection('test').subscribe;
  });

  it('should return initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

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

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

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

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

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

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

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

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

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

  it('should handle autocancelled requests', async () => {
    const autocancelError = new Error('The request was autocancelled');
    mockGetFullList.mockRejectedValue(autocancelError);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Should not set error for autocancelled requests
    expect(result.current.error).toBe(null);
    expect(result.current.isError).toBe(false);
  });

  it('should handle non-Error exceptions', async () => {
    mockGetFullList.mockRejectedValue('String error');

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Failed to fetch collection');
    expect(result.current.isError).toBe(true);
  });

  it('should handle real-time create events', async () => {
    const initialData = [{ id: '1', title: 'Test 1' }];
    const newRecord = { id: '2', title: 'Test 2' };

    mockGetFullList.mockResolvedValue(initialData);

    let subscriptionCallback: any;
    mockSubscribe.mockImplementation((pattern: string, callback: any) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Simulate create event
    await act(async () => {
      subscriptionCallback({
        action: 'create',
        record: newRecord,
      });
    });

    expect(result.current.data).toEqual([...initialData, newRecord]);
  });

  it('should handle real-time update events', async () => {
    const initialData = [
      { id: '1', title: 'Test 1' },
      { id: '2', title: 'Test 2' },
    ];
    const updatedRecord = { id: '1', title: 'Updated Test 1' };

    mockGetFullList.mockResolvedValue(initialData);

    let subscriptionCallback: any;
    mockSubscribe.mockImplementation((pattern: string, callback: any) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Simulate update event
    await act(async () => {
      subscriptionCallback({
        action: 'update',
        record: updatedRecord,
      });
    });

    expect(result.current.data).toEqual([updatedRecord, { id: '2', title: 'Test 2' }]);
  });

  it('should handle real-time update events for non-existent records', async () => {
    const initialData = [{ id: '1', title: 'Test 1' }];
    const newRecord = { id: '2', title: 'New Test 2' };

    mockGetFullList.mockResolvedValue(initialData);

    let subscriptionCallback: any;
    mockSubscribe.mockImplementation((pattern: string, callback: any) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Simulate update event for non-existent record
    await act(async () => {
      subscriptionCallback({
        action: 'update',
        record: newRecord,
      });
    });

    expect(result.current.data).toEqual([...initialData, newRecord]);
  });

  it('should handle real-time delete events', async () => {
    const initialData = [
      { id: '1', title: 'Test 1' },
      { id: '2', title: 'Test 2' },
    ];

    mockGetFullList.mockResolvedValue(initialData);

    let subscriptionCallback: any;
    mockSubscribe.mockImplementation((pattern: string, callback: any) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Simulate delete event
    await act(async () => {
      subscriptionCallback({
        action: 'delete',
        record: { id: '1', title: 'Test 1' },
      });
    });

    expect(result.current.data).toEqual([{ id: '2', title: 'Test 2' }]);
  });

  it('should apply sorting after real-time updates', async () => {
    const initialData = [
      { id: '1', title: 'Charlie' },
      { id: '2', title: 'Alpha' },
    ];

    mockGetFullList.mockResolvedValue(initialData);

    let subscriptionCallback: any;
    mockSubscribe.mockImplementation((pattern: string, callback: any) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useCollection('test', { sort: 'title' }), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Simulate create event
    await act(async () => {
      subscriptionCallback({
        action: 'create',
        record: { id: '3', title: 'Beta' },
      });
    });

    expect(result.current.data).toEqual([
      { id: '2', title: 'Alpha' },
      { id: '3', title: 'Beta' },
      { id: '1', title: 'Charlie' },
    ]);
  });

  it('should handle real-time updates when currentData is null', async () => {
    mockGetFullList.mockResolvedValue(null);

    let subscriptionCallback: any;
    mockSubscribe.mockImplementation((pattern: string, callback: any) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Simulate create event when data is null
    await act(async () => {
      subscriptionCallback({
        action: 'create',
        record: { id: '1', title: 'Test' },
      });
    });

    // Should not crash and data should be empty array
    expect(result.current.data).toEqual([]);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useCollection('test'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
