import '@testing-library/jest-dom/vitest';
import { act, renderHook } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCollection } from '../../src/hooks/useCollection';
import { createMockPocketBase, createWrapper, getMockCollectionMethods } from '../test-utils';

describe('useCollection', () => {
  let mockPocketBase: PocketBase;
  let mockGetFullList: any;
  let mockGetList: any;
  let mockSubscribe: any;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
    const methods = getMockCollectionMethods(mockPocketBase);
    mockGetFullList = methods.getFullList;
    mockGetList = methods.getList;
    mockSubscribe = methods.subscribe;
  });

  it('should return initial state', () => {
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('should fetch collection data', async () => {
    const mockData = [
      { id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' },
      { id: '2', title: 'Test 2', collectionId: 'test', collectionName: 'test' },
    ];

    mockGetFullList.mockResolvedValue(mockData);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCollection('test'), { wrapper });

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

    const wrapper = createWrapper(mockPocketBase);

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
    const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
    mockGetFullList.mockResolvedValue(mockData);

    const wrapper = createWrapper(mockPocketBase);

    renderHook(() => useCollection('test'), { wrapper });

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

    const wrapper = createWrapper(mockPocketBase);

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

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('The request was autocancelled');
    expect(result.current.isError).toBe(true);
  });

  it('should handle non-Error exceptions', async () => {
    mockGetFullList.mockRejectedValue('String error');

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Failed to fetch collection');
    expect(result.current.isError).toBe(true);
  });

  it('should handle real-time create events', async () => {
    const initialData = [{ id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' }];
    const newRecord = { id: '2', title: 'Test 2', collectionId: 'test', collectionName: 'test' };

    mockGetFullList.mockResolvedValue(initialData);

    let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
    mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

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
      { id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' },
      { id: '2', title: 'Test 2', collectionId: 'test', collectionName: 'test' },
    ];
    const updatedRecord = { id: '1', title: 'Updated Test 1', collectionId: 'test', collectionName: 'test' };

    mockGetFullList.mockResolvedValue(initialData);

    let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
    mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      subscriptionCallback({
        action: 'update',
        record: updatedRecord,
      });
    });

    expect(result.current.data).toEqual([updatedRecord, { id: '2', title: 'Test 2', collectionId: 'test', collectionName: 'test' }]);
  });

  it('should handle real-time update events for non-existent records', async () => {
    const initialData = [{ id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' }];
    const newRecord = { id: '2', title: 'New Test 2', collectionId: 'test', collectionName: 'test' };

    mockGetFullList.mockResolvedValue(initialData);

    let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
    mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

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
      { id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' },
      { id: '2', title: 'Test 2', collectionId: 'test', collectionName: 'test' },
    ];

    mockGetFullList.mockResolvedValue(initialData);

    let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
    mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      subscriptionCallback({
        action: 'delete',
        record: { id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' },
      });
    });

    expect(result.current.data).toEqual([{ id: '2', title: 'Test 2', collectionId: 'test', collectionName: 'test' }]);
  });

  it('should apply sorting after real-time updates', async () => {
    const initialData = [
      { id: '1', title: 'Charlie', collectionId: 'test', collectionName: 'test' },
      { id: '2', title: 'Alpha', collectionId: 'test', collectionName: 'test' },
    ];

    mockGetFullList.mockResolvedValue(initialData);

    let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
    mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCollection('test', { sort: 'title' }), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      subscriptionCallback({
        action: 'create',
        record: { id: '3', title: 'Beta', collectionId: 'test', collectionName: 'test' },
      });
    });

    expect(result.current.data).toEqual([
      { id: '2', title: 'Alpha', collectionId: 'test', collectionName: 'test' },
      { id: '3', title: 'Beta', collectionId: 'test', collectionName: 'test' },
      { id: '1', title: 'Charlie', collectionId: 'test', collectionName: 'test' },
    ]);
  });

  it('should handle real-time updates when currentData is null', async () => {
    mockGetFullList.mockResolvedValue(null);

    let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
    mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCollection('test'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      subscriptionCallback({
        action: 'create',
        record: { id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' },
      });
    });

    expect(result.current.data).toStrictEqual([{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }]);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useCollection('test'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });

  describe('enabled option', () => {
    it('should not fetch data when enabled is false', async () => {
      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCollection('test', { enabled: false }), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual([]);
      expect(mockGetFullList).not.toHaveBeenCalled();
    });

    it('should not subscribe to real-time updates when enabled is false', async () => {
      const wrapper = createWrapper(mockPocketBase);

      renderHook(() => useCollection('test', { enabled: false }), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSubscribe).not.toHaveBeenCalled();
    });

    it('should fetch data when enabled changes from false to true', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      mockGetFullList.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result, rerender } = renderHook(({ enabled }) => useCollection('test', { enabled }), {
        wrapper,
        initialProps: { enabled: false },
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockGetFullList).not.toHaveBeenCalled();

      rerender({ enabled: true });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(mockGetFullList).toHaveBeenCalled();
    });

    it('should subscribe to real-time updates when enabled changes from false to true', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      mockGetFullList.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { rerender } = renderHook(({ enabled }) => useCollection('test', { enabled }), {
        wrapper,
        initialProps: { enabled: false },
      });

      expect(mockSubscribe).not.toHaveBeenCalled();

      rerender({ enabled: true });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSubscribe).toHaveBeenCalled();
    });

    it('should stop fetching and subscribing when enabled changes from true to false', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      mockGetFullList.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result, rerender } = renderHook(({ enabled }) => useCollection('test', { enabled }), {
        wrapper,
        initialProps: { enabled: true },
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockGetFullList).toHaveBeenCalledTimes(1);

      rerender({ enabled: false });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockGetFullList).toHaveBeenCalledTimes(1);
    });

    it('should default enabled to true when not provided', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      mockGetFullList.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCollection('test'), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockGetFullList).toHaveBeenCalled();
    });
  });

  describe('fetchAll option', () => {
    it('should use getFullList when fetchAll is true (default)', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      mockGetFullList.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCollection('test', { fetchAll: true }), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockGetFullList).toHaveBeenCalledWith({});
      expect(mockGetList).not.toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData);
    });

    it('should use getList when fetchAll is false', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      const mockListResult = { items: mockData, totalItems: 1, totalPages: 1, page: 1, perPage: 20 };
      mockGetList.mockResolvedValue(mockListResult);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCollection('test', { fetchAll: false }), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockGetList).toHaveBeenCalledWith(1, 20, {});
      expect(mockGetFullList).not.toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData);
    });

    it('should use getList with custom page and perPage when fetchAll is false', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      const mockListResult = { items: mockData, totalItems: 1, totalPages: 1, page: 2, perPage: 10 };
      mockGetList.mockResolvedValue(mockListResult);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(
        () =>
          useCollection('test', {
            fetchAll: false,
            page: 2,
            perPage: 10,
            filter: 'status = "published"',
            sort: '-created',
          }),
        { wrapper },
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockGetList).toHaveBeenCalledWith(2, 10, {
        filter: 'status = "published"',
        sort: '-created',
      });
      expect(mockGetFullList).not.toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData);
    });

    it('should use default page and perPage values when fetchAll is false and values not provided', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      const mockListResult = { items: mockData, totalItems: 1, totalPages: 1, page: 1, perPage: 20 };
      mockGetList.mockResolvedValue(mockListResult);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCollection('test', { fetchAll: false }), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockGetList).toHaveBeenCalledWith(1, 20, {});
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('realtime option', () => {
    it('should subscribe to real-time updates when realtime is true (default)', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      mockGetFullList.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      renderHook(() => useCollection('test', { realtime: true }), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSubscribe).toHaveBeenCalledWith('*', expect.any(Function), {
        expand: undefined,
        filter: undefined,
      });
    });

    it('should not subscribe to real-time updates when realtime is false', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      mockGetFullList.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      renderHook(() => useCollection('test', { realtime: false }), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSubscribe).not.toHaveBeenCalled();
    });

    it('should not subscribe when both enabled and realtime are false', async () => {
      const wrapper = createWrapper(mockPocketBase);

      renderHook(() => useCollection('test', { enabled: false, realtime: false }), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSubscribe).not.toHaveBeenCalled();
      expect(mockGetFullList).not.toHaveBeenCalled();
    });

    it('should subscribe when enabled is true but realtime is false initially, then realtime becomes true', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      mockGetFullList.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { rerender } = renderHook(({ realtime }) => useCollection('test', { realtime }), {
        wrapper,
        initialProps: { realtime: false },
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSubscribe).not.toHaveBeenCalled();

      rerender({ realtime: true });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe when realtime changes from true to false', async () => {
      const mockData = [{ id: '1', title: 'Test', collectionId: 'test', collectionName: 'test' }];
      mockGetFullList.mockResolvedValue(mockData);
      const unsubSpy = vi.fn();
      mockSubscribe.mockResolvedValue(unsubSpy);
      const wrapper = createWrapper(mockPocketBase);
      const { rerender } = renderHook(({ realtime }) => useCollection('test', { realtime }), {
        wrapper,
        initialProps: { realtime: true },
      });
      await act(async () => {
        await Promise.resolve();
      });
      rerender({ realtime: false });
      await act(async () => {
        await Promise.resolve();
      });
      expect(unsubSpy).toHaveBeenCalled();
    });
  });

  describe('transformers', () => {
    it('should apply default dateTransformer to created and updated fields', async () => {
      const mockData = [
        {
          id: '1',
          title: 'Test 1',
          collectionId: 'test',
          collectionName: 'test',
          created: '2024-01-01T10:00:00.123Z',
          updated: '2024-01-01T11:00:00.456Z',
        },
      ];

      mockGetFullList.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCollection('test'), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.data?.[0]?.created).toBeInstanceOf(Date);
      expect(result.current.data?.[0]?.updated).toBeInstanceOf(Date);
      expect((result.current.data?.[0]?.created as Date).toISOString()).toBe('2024-01-01T10:00:00.123Z');
      expect((result.current.data?.[0]?.updated as Date).toISOString()).toBe('2024-01-01T11:00:00.456Z');
    });

    it('should apply transformers to fetched data', async () => {
      const mockData = [
        {
          id: '1',
          title: 'Test 1',
          collectionId: 'test',
          collectionName: 'test',
          created: '2024-01-01T10:00:00Z',
          updated: '2024-01-01T11:00:00Z',
        },
      ];

      mockGetFullList.mockResolvedValue(mockData);

      const customTransformer = (record: any) => ({
        ...record,
        title: record.title.toUpperCase(),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(
        () =>
          useCollection('test', {
            transformers: [customTransformer],
          }),
        { wrapper },
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.data).toEqual([
        {
          id: '1',
          title: 'TEST 1',
          collectionId: 'test',
          collectionName: 'test',
          created: '2024-01-01T10:00:00Z',
          updated: '2024-01-01T11:00:00Z',
        },
      ]);
    });

    it('should apply transformers to real-time create events', async () => {
      const initialData = [{ id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' }];
      const newRecord = { id: '2', title: 'Test 2', collectionId: 'test', collectionName: 'test' };

      mockGetFullList.mockResolvedValue(initialData);

      let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
      mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
        subscriptionCallback = callback;
        return Promise.resolve(() => {});
      });

      const customTransformer = (record: any) => ({
        ...record,
        title: record.title.toUpperCase(),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(
        () =>
          useCollection('test', {
            transformers: [customTransformer],
          }),
        { wrapper },
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        subscriptionCallback({
          action: 'create',
          record: newRecord,
        });
      });

      expect(result.current.data).toEqual([
        { id: '1', title: 'TEST 1', collectionId: 'test', collectionName: 'test' },
        { id: '2', title: 'TEST 2', collectionId: 'test', collectionName: 'test' },
      ]);
    });

    it('should apply transformers to real-time update events', async () => {
      const initialData = [
        { id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' },
        { id: '2', title: 'Test 2', collectionId: 'test', collectionName: 'test' },
      ];
      const updatedRecord = { id: '1', title: 'Updated Test 1', collectionId: 'test', collectionName: 'test' };

      mockGetFullList.mockResolvedValue(initialData);

      let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
      mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
        subscriptionCallback = callback;
        return Promise.resolve(() => {});
      });

      const customTransformer = (record: any) => ({
        ...record,
        title: record.title.toUpperCase(),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(
        () =>
          useCollection('test', {
            transformers: [customTransformer],
          }),
        { wrapper },
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        subscriptionCallback({
          action: 'update',
          record: updatedRecord,
        });
      });

      expect(result.current.data).toEqual([
        { id: '1', title: 'UPDATED TEST 1', collectionId: 'test', collectionName: 'test' },
        { id: '2', title: 'TEST 2', collectionId: 'test', collectionName: 'test' },
      ]);
    });

    it('should handle transformer errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockData = [{ id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' }];

      // Mock getFullList to return data without transformers applied
      mockGetFullList.mockResolvedValue(mockData);

      let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
      mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
        subscriptionCallback = callback;
        return Promise.resolve(() => {});
      });

      const faultyTransformer = (record: any) => {
        throw new Error('Transformer error');
      };

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(
        () =>
          useCollection('test', {
            transformers: [faultyTransformer],
          }),
        { wrapper },
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // The initial data should be returned without transformation when transformer fails
      expect(result.current.data).toEqual([{ id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' }]);
      expect(result.current.isError).toBe(false);

      await act(async () => {
        subscriptionCallback({
          action: 'create',
          record: { id: '2', title: 'Test 2', collectionId: 'test', collectionName: 'test' },
        });
      });

      // Should fallback to original record when transformer fails in real-time
      expect(result.current.data).toEqual([
        { id: '1', title: 'Test 1', collectionId: 'test', collectionName: 'test' },
        { id: '2', title: 'Test 2', collectionId: 'test', collectionName: 'test' },
      ]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should apply multiple transformers in sequence', async () => {
      const mockData = [{ id: '1', title: 'test', collectionId: 'test', collectionName: 'test' }];

      mockGetFullList.mockResolvedValue(mockData);

      const transformer1 = (record: any) => ({
        ...record,
        title: record.title.toUpperCase(),
      });

      const transformer2 = (record: any) => ({
        ...record,
        title: record.title + '!',
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(
        () =>
          useCollection('test', {
            transformers: [transformer1, transformer2],
          }),
        { wrapper },
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.data).toEqual([{ id: '1', title: 'TEST!', collectionId: 'test', collectionName: 'test' }]);
    });
  });
});
