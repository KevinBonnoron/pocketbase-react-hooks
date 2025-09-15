import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRecord } from '../../src/hooks/useRecord';
import { createMockPocketBase, createWrapper, getMockCollectionMethods } from '../test-utils';

describe('useRecord', () => {
  let mockPocketBase: PocketBase;
  let mockGetOne: any;
  let mockGetFirstListItem: any;
  let mockSubscribe: any;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
    const methods = getMockCollectionMethods(mockPocketBase);
    mockGetOne = methods.getOne;
    mockGetFirstListItem = methods.getFirstListItem;
    mockSubscribe = methods.subscribe;
  });

  it('should return initial state when no recordId is provided', () => {
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useRecord('test', null), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('should fetch record by ID', async () => {
    const mockRecord = { id: '1', title: 'Test Record', collectionId: 'test', collectionName: 'test' };
    mockGetOne.mockResolvedValue(mockRecord);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useRecord('test', '1'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockGetOne).toHaveBeenCalledWith('1', {});
    expect(result.current.data).toEqual(mockRecord);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('should fetch record by filter', async () => {
    const mockRecord = { id: '1', title: 'Test Record', collectionId: 'test', collectionName: 'test' };
    mockGetFirstListItem.mockResolvedValue(mockRecord);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useRecord('test', 'slug="test-record"'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockGetFirstListItem).toHaveBeenCalledWith('slug="test-record"', {});
    expect(result.current.data).toEqual(mockRecord);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Record not found');
    mockGetOne.mockRejectedValue(mockError);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useRecord('test', '1'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Record not found');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBe(null);
  });

  it('should use custom options', async () => {
    const mockRecord = { id: '1', title: 'Test Record', collectionId: 'test', collectionName: 'test' };
    mockGetOne.mockResolvedValue(mockRecord);

    const wrapper = createWrapper(mockPocketBase);

    renderHook(
      () =>
        useRecord('test', '1', {
          expand: 'author',
          fields: 'id,title,content',
        }),
      { wrapper },
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockGetOne).toHaveBeenCalledWith('1', {
      expand: 'author',
      fields: 'id,title,content',
    });
  });

  it('should subscribe to real-time updates by ID', async () => {
    const mockRecord = { id: '1', title: 'Test Record', collectionId: 'test', collectionName: 'test' };
    mockGetOne.mockResolvedValue(mockRecord);

    const wrapper = createWrapper(mockPocketBase);

    renderHook(() => useRecord('test', '1'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockSubscribe).toHaveBeenCalledWith('1', expect.any(Function), {
      expand: undefined,
    });
  });

  it('should subscribe to real-time updates by filter', async () => {
    const mockRecord = { id: '1', title: 'Test Record', collectionId: 'test', collectionName: 'test' };
    mockGetFirstListItem.mockResolvedValue(mockRecord);

    const wrapper = createWrapper(mockPocketBase);

    renderHook(() => useRecord('test', 'slug="test-record"'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockSubscribe).toHaveBeenCalledWith('*', expect.any(Function), {
      expand: undefined,
      filter: 'slug="test-record"',
    });
  });

  it('should handle real-time update events', async () => {
    const initialRecord = { id: '1', title: 'Test Record', collectionId: 'test', collectionName: 'test' };
    const updatedRecord = { id: '1', title: 'Updated Record', collectionId: 'test', collectionName: 'test' };

    mockGetOne.mockResolvedValue(initialRecord);

    let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
    mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useRecord('test', '1'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(initialRecord);

    await act(async () => {
      subscriptionCallback({
        action: 'update',
        record: updatedRecord,
      });
    });

    expect(result.current.data).toEqual(updatedRecord);
  });

  it('should handle real-time delete events', async () => {
    const initialRecord = { id: '1', title: 'Test Record', collectionId: 'test', collectionName: 'test' };
    const deletedRecord = { id: '1', title: 'Deleted Record', collectionId: 'test', collectionName: 'test' };

    mockGetOne.mockResolvedValue(initialRecord);

    let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
    mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useRecord('test', '1'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(initialRecord);

    await act(async () => {
      subscriptionCallback({
        action: 'delete',
        record: deletedRecord,
      });
    });

    expect(result.current.data).toBe(null);
  });

  it('should handle real-time create events for filter-based queries', async () => {
    const initialRecord = { id: '1', title: 'Test Record', collectionId: 'test', collectionName: 'test' };
    const newRecord = { id: '2', title: 'New Record', collectionId: 'test', collectionName: 'test' };

    mockGetFirstListItem.mockResolvedValue(initialRecord);

    let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
    mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useRecord('test', 'slug="test-record"'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(initialRecord);

    await act(async () => {
      subscriptionCallback({
        action: 'create',
        record: newRecord,
      });
    });

    expect(result.current.data).toEqual(newRecord);
  });

  it('should ignore real-time delete events for different records when using filter', async () => {
    const initialRecord = { id: '1', title: 'Test Record', collectionId: 'test', collectionName: 'test' };
    const otherRecord = { id: '2', title: 'Other Record', collectionId: 'test', collectionName: 'test' };

    mockGetFirstListItem.mockResolvedValue(initialRecord);

    let subscriptionCallback: (event: { action: string; record: RecordModel }) => void;
    mockSubscribe.mockImplementation((_pattern: string, callback: (event: { action: string; record: RecordModel }) => void) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useRecord('test', 'slug="test-record"'), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(initialRecord);

    await act(async () => {
      subscriptionCallback({
        action: 'delete',
        record: otherRecord,
      });
    });

    expect(result.current.data).toEqual(initialRecord);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useRecord('test', '1'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
