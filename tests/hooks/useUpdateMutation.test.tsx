import { renderHook, waitFor } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import { beforeEach, describe, expect, it } from 'vitest';
import { useUpdateMutation } from '../../src/hooks/useUpdateMutation';
import { createMockPocketBase, createWrapper, getMockCollectionMethods } from '../test-utils';

describe('useUpdateMutation', () => {
  let mockPocketBase: PocketBase;
  let mockUpdate: any;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
    const methods = getMockCollectionMethods(mockPocketBase);
    mockUpdate = methods.update;
  });

  it('should return initial state', () => {
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isSuccess).toBe(true);
    expect(typeof result.current.mutate).toBe('function');
  });

  it('should handle update mutation', async () => {
    const mockData = { id: '1', title: 'Updated Item' };
    mockUpdate.mockResolvedValue(mockData);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    const mutationResult = await result.current.mutate('1', {
      title: 'Updated Item',
    });

    return waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('1', {
        title: 'Updated Item',
      });
      expect(mutationResult).toEqual(mockData);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle update mutation with options', async () => {
    const mockData = { id: '1', title: 'Updated Item' };
    mockUpdate.mockResolvedValue(mockData);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    const options = { expand: 'relation' };
    await result.current.mutate('1', { title: 'Updated Item' }, options);

    return waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('1', { title: 'Updated Item' }, options);
    });
  });

  it('should handle mutation error', async () => {
    const mockError = new Error('Update failed');
    mockUpdate.mockRejectedValue(mockError);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    await result.current.mutate('1', { title: 'Test' });

    return waitFor(() => {
      expect(result.current.error).toEqual('Update failed');
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  it('should handle non-Error exceptions', async () => {
    mockUpdate.mockRejectedValue('String error');

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    await result.current.mutate('1', { title: 'Test' });

    return waitFor(() => {
      expect(result.current.error).toBe('Error updating record');
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  it('should set isPending to true during mutation', async () => {
    let resolveUpdate: (value: unknown) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    mockUpdate.mockReturnValue(updatePromise);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    waitFor(() => {
      result.current.mutate('1', { title: 'Test' });
      expect(result.current.isPending).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      resolveUpdate({ id: '1', title: 'Test' });
    });

    await updatePromise;

    return waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useUpdateMutation('test'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
