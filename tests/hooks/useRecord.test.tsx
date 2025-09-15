import '@testing-library/jest-dom';
import { renderHook, waitFor } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecord } from '../../src/hooks/useRecord';
import { PocketBaseProvider } from '../../src/providers/PocketBaseProvider';

describe('useRecord', () => {
  let mockPocketBase: any;
  let mockGetOne: any;
  let mockSubscribe: any;

  beforeEach(() => {
    mockGetOne = vi.fn();
    mockSubscribe = vi.fn();

    mockPocketBase = {
      autoCancellation: vi.fn(() => mockPocketBase),
      collection: vi.fn(() => ({
        getOne: mockGetOne,
        subscribe: mockSubscribe,
      })),
    } as unknown as PocketBase;

    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

  it('should return initial state', () => {
    mockGetOne.mockResolvedValue({});
    mockSubscribe.mockResolvedValue(() => {});

    const { result } = renderHook(() => useRecord('posts', '12345678-1234-1234-1234-123456789012'), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should fetch record data', async () => {
    const mockRecord: RecordModel = {
      id: '12345678-1234-1234-1234-123456789012',
      title: 'Test Post',
      content: 'Test content',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z',
      collectionId: 'posts',
      collectionName: 'posts',
    };

    mockGetOne.mockResolvedValue(mockRecord);
    mockSubscribe.mockResolvedValue(() => {});

    const { result } = renderHook(() => useRecord('posts', '12345678-1234-1234-1234-123456789012'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual(mockRecord);
    expect(result.current.error).toBe(null);
    expect(mockGetOne).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789012', {});
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Record not found');
    mockGetOne.mockRejectedValue(mockError);
    mockSubscribe.mockResolvedValue(() => {});

    const { result } = renderHook(() => useRecord('posts', '12345678-1234-1234-1234-123456789012'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Record not found');
  });

  it('should subscribe to real-time updates', async () => {
    const mockRecord: RecordModel = {
      id: '12345678-1234-1234-1234-123456789012',
      title: 'Test Post',
      content: 'Test content',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z',
      collectionId: 'posts',
      collectionName: 'posts',
    };

    mockGetOne.mockResolvedValue(mockRecord);
    mockSubscribe.mockResolvedValue(() => {});

    renderHook(() => useRecord('posts', '12345678-1234-1234-1234-123456789012'), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789012', expect.any(Function), {});
    });
  });

  it('should use custom options', async () => {
    const mockRecord: RecordModel = {
      id: '12345678-1234-1234-1234-123456789012',
      title: 'Test Post',
      content: 'Test content',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z',
      collectionId: 'posts',
      collectionName: 'posts',
    };

    const customOptions = {
      expand: 'author',
      fields: 'id,title,content',
    };

    mockGetOne.mockResolvedValue(mockRecord);
    mockSubscribe.mockResolvedValue(() => {});

    renderHook(() => useRecord('posts', '12345678-1234-1234-1234-123456789012', customOptions), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockGetOne).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789012', customOptions);
    });
  });

  it('should handle null recordId', async () => {
    const { result } = renderHook(() => useRecord('posts', null), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockGetOne).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('should handle undefined recordId', async () => {
    const { result } = renderHook(() => useRecord('posts', undefined), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockGetOne).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('should handle real-time update events', async () => {
    const initialRecord: RecordModel = {
      id: '12345678-1234-1234-1234-123456789012',
      title: 'Original Title',
      content: 'Original content',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z',
      collectionId: 'posts',
      collectionName: 'posts',
    };

    const updatedRecord: RecordModel = {
      id: '12345678-1234-1234-1234-123456789012',
      title: 'Updated Title',
      content: 'Updated content',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z',
      collectionId: 'posts',
      collectionName: 'posts',
    };

    mockGetOne.mockResolvedValue(initialRecord);

    let subscriptionCallback: any;
    mockSubscribe.mockImplementation((_recordId: string, callback: any) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const { result } = renderHook(() => useRecord('posts', '12345678-1234-1234-1234-123456789012'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(initialRecord);
    });

    // Simulate update event
    subscriptionCallback({
      action: 'update',
      record: updatedRecord,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedRecord);
    });
  });

  it('should handle real-time delete events', async () => {
    const initialRecord: RecordModel = {
      id: '12345678-1234-1234-1234-123456789012',
      title: 'Test Post',
      content: 'Test content',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z',
      collectionId: 'posts',
      collectionName: 'posts',
    };

    mockGetOne.mockResolvedValue(initialRecord);

    let subscriptionCallback: any;
    mockSubscribe.mockImplementation((_recordId: string, callback: any) => {
      subscriptionCallback = callback;
      return Promise.resolve(() => {});
    });

    const { result } = renderHook(() => useRecord('posts', '12345678-1234-1234-1234-123456789012'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(initialRecord);
    });

    // Simulate delete event
    subscriptionCallback({
      action: 'delete',
      record: initialRecord,
    });

    await waitFor(() => {
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('Record has been deleted');
    });
  });

  it('should handle non-Error exceptions', async () => {
    mockGetOne.mockRejectedValue('String error');
    mockSubscribe.mockResolvedValue(() => {});

    const { result } = renderHook(() => useRecord('posts', '12345678-1234-1234-1234-123456789012'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Failed to fetch record');
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useRecord('posts', '12345678-1234-1234-1234-123456789012'));
    }).toThrow();

    consoleSpy.mockRestore();
  });

  it('should fetch record by filter', async () => {
    const mockRecord: RecordModel = {
      id: '12345678-1234-1234-1234-123456789012',
      title: 'Test Post',
      slug: 'test-post',
      content: 'Test content',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z',
      collectionId: 'posts',
      collectionName: 'posts',
    };

    const mockGetFirstListItem = vi.fn().mockResolvedValue(mockRecord);
    mockPocketBase.collection = vi.fn(() => ({
      getOne: mockGetOne,
      getFirstListItem: mockGetFirstListItem,
      subscribe: mockSubscribe,
    }));

    mockSubscribe.mockResolvedValue(() => {});

    const { result } = renderHook(() => useRecord('posts', 'slug="test-post"'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual(mockRecord);
    expect(result.current.error).toBe(null);
    expect(mockGetFirstListItem).toHaveBeenCalledWith('slug="test-post"', {});
  });

  it('should handle filter fetch error', async () => {
    const mockError = new Error('Record not found');
    const mockGetFirstListItem = vi.fn().mockRejectedValue(mockError);
    mockPocketBase.collection = vi.fn(() => ({
      getOne: mockGetOne,
      getFirstListItem: mockGetFirstListItem,
      subscribe: mockSubscribe,
    }));

    mockSubscribe.mockResolvedValue(() => {});

    const { result } = renderHook(() => useRecord('posts', 'slug="non-existent"'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Record not found');
  });

  it('should subscribe to real-time updates for filter', async () => {
    const mockRecord: RecordModel = {
      id: '12345678-1234-1234-1234-123456789012',
      title: 'Test Post',
      slug: 'test-post',
      content: 'Test content',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z',
      collectionId: 'posts',
      collectionName: 'posts',
    };

    const mockGetFirstListItem = vi.fn().mockResolvedValue(mockRecord);
    mockPocketBase.collection = vi.fn(() => ({
      getOne: mockGetOne,
      getFirstListItem: mockGetFirstListItem,
      subscribe: mockSubscribe,
    }));

    mockSubscribe.mockResolvedValue(() => {});

    renderHook(() => useRecord('posts', 'slug="test-post"'), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith('*', expect.any(Function), {
        expand: undefined,
        fields: undefined,
        filter: 'slug="test-post"',
      });
    });
  });
});
