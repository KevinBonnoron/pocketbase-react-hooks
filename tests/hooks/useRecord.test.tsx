import '@testing-library/jest-dom';
import { renderHook, waitFor } from '@testing-library/react';
import type Pocketbase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecord } from '../../src/hooks/useRecord';
import { PocketbaseProvider } from '../../src/providers/PocketbaseProvider';

describe('useRecord', () => {
  let mockPocketbase: any;
  let mockGetOne: any;
  let mockSubscribe: any;

  beforeEach(() => {
    mockGetOne = vi.fn();
    mockSubscribe = vi.fn();

    mockPocketbase = {
      autoCancellation: vi.fn(() => mockPocketbase),
      collection: vi.fn(() => ({
        getOne: mockGetOne,
        subscribe: mockSubscribe,
      })),
    } as unknown as Pocketbase;

    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

  it('should return initial state', () => {
    mockGetOne.mockResolvedValue({});
    mockSubscribe.mockResolvedValue(() => {});

    const { result } = renderHook(() => useRecord('posts', 'record-id'), {
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
      id: 'record-id',
      title: 'Test Post',
      content: 'Test content',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z',
      collectionId: 'posts',
      collectionName: 'posts',
    };

    mockGetOne.mockResolvedValue(mockRecord);
    mockSubscribe.mockResolvedValue(() => {});

    const { result } = renderHook(() => useRecord('posts', 'record-id'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual(mockRecord);
    expect(result.current.error).toBe(null);
    expect(mockGetOne).toHaveBeenCalledWith('record-id', {});
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Record not found');
    mockGetOne.mockRejectedValue(mockError);
    mockSubscribe.mockResolvedValue(() => {});

    const { result } = renderHook(() => useRecord('posts', 'record-id'), {
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
      id: 'record-id',
      title: 'Test Post',
      content: 'Test content',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z',
      collectionId: 'posts',
      collectionName: 'posts',
    };

    mockGetOne.mockResolvedValue(mockRecord);
    mockSubscribe.mockResolvedValue(() => {});

    renderHook(() => useRecord('posts', 'record-id'), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith('record-id', expect.any(Function), {});
    });
  });

  it('should use custom options', async () => {
    const mockRecord: RecordModel = {
      id: 'record-id',
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

    renderHook(() => useRecord('posts', 'record-id', customOptions), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockGetOne).toHaveBeenCalledWith('record-id', customOptions);
    });
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useRecord('posts', 'record-id'));
    }).toThrow();

    consoleSpy.mockRestore();
  });
});
