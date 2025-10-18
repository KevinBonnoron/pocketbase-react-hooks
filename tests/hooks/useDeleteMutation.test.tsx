import { renderHook, waitFor } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDeleteMutation } from '../../src/hooks/useDeleteMutation';
import { createMockPocketBase, createWrapper, getMockCollectionMethods } from '../test-utils';

describe('useDeleteMutation', () => {
  let mockPocketBase: PocketBase;
  let mockDelete: any;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
    const methods = getMockCollectionMethods(mockPocketBase);
    mockDelete = methods.delete;
  });

  it('should return initial state', () => {
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isSuccess).toBe(true);
    expect(typeof result.current.mutate).toBe('function');
  });

  it('should handle delete mutation', async () => {
    mockDelete.mockResolvedValue(true);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    const mutationResult = await result.current.mutate('1');

    return waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('1', undefined);
      expect(mutationResult).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle delete mutation with options', async () => {
    mockDelete.mockResolvedValue(true);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    const options = { headers: { 'X-Custom': 'value' } };

    await result.current.mutate('1', options);
    return waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('1', options);
    });
  });

  it('should handle mutation error', async () => {
    const mockError = new Error('Delete failed');
    mockDelete.mockRejectedValue(mockError);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    await result.current.mutate('1');

    return waitFor(() => {
      expect(result.current.error).toEqual('Delete failed');
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  it('should handle non-Error exceptions', async () => {
    mockDelete.mockRejectedValue('String error');

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    await result.current.mutate('1');

    return waitFor(() => {
      expect(result.current.error).toBe('Error deleting record');
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  it('should set isPending to true during mutation', async () => {
    let resolveDelete: (value: unknown) => void;
    const deletePromise = new Promise((resolve) => {
      resolveDelete = resolve;
    });
    mockDelete.mockReturnValue(deletePromise);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useDeleteMutation('test'), { wrapper });

    waitFor(() => {
      result.current.mutate('1');
      expect(result.current.isPending).toBe(true);
      expect(result.current.isSuccess).toBe(false);
    });

    await waitFor(() => {
      resolveDelete(true);
    });

    await deletePromise;

    return waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useDeleteMutation('test'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
