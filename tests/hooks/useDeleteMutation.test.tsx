import { act, renderHook } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeleteMutation } from '../../src/hooks/useDeleteMutation';
import { PocketBaseProvider } from '../../src/providers/PocketBaseProvider';

const createMockPocketBase = () => {
  const mockDelete = vi.fn();

  return {
    baseURL: 'http://localhost:8090',
    collection: vi.fn().mockReturnValue({
      delete: mockDelete,
    }),
    authStore: {
      isValid: false,
      model: null,
      onChange: vi.fn(() => () => {}),
    },
  } as unknown as PocketBase;
};

describe('useDeleteMutation', () => {
  let mockPocketBase: PocketBase;
  let mockDelete: any;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
    const collection = mockPocketBase.collection('test');
    mockDelete = collection.delete;
  });

  it('should return initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isSuccess).toBe(true);
    expect(typeof result.current.mutate).toBe('function');
  });

  it('should handle delete mutation', async () => {
    mockDelete.mockResolvedValue(true);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.mutate('1');
    });

    expect(mockDelete).toHaveBeenCalledWith('1', undefined);
    expect(mutationResult).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });

  it('should handle delete mutation with options', async () => {
    mockDelete.mockResolvedValue(true);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    const options = { headers: { 'X-Custom': 'value' } };
    await act(async () => {
      await result.current.mutate('1', options);
    });

    expect(mockDelete).toHaveBeenCalledWith('1', options);
  });

  it('should handle mutation error', async () => {
    const mockError = new Error('Delete failed');
    mockDelete.mockRejectedValue(mockError);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    await act(async () => {
      await result.current.mutate('1');
    });

    expect(result.current.error).toEqual('Delete failed');
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('should handle non-Error exceptions', async () => {
    mockDelete.mockRejectedValue('String error');

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    await act(async () => {
      await result.current.mutate('1');
    });

    expect(result.current.error).toBe('Error deleting record');
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('should set isPending to true during mutation', async () => {
    let resolveDelete: (value: unknown) => void;
    const deletePromise = new Promise((resolve) => {
      resolveDelete = resolve;
    });
    mockDelete.mockReturnValue(deletePromise);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    act(() => {
      result.current.mutate('1');
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isSuccess).toBe(false);

    await act(async () => {
      resolveDelete(true);
      await deletePromise;
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useDeleteMutation('test'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
