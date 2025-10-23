import { renderHook, waitFor } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import { beforeEach, describe, expect, it } from 'vitest';
import { useUpdateMutation } from '../../src/hooks/useUpdateMutation';
import { createMockPocketBase, createWrapper, getMockCollectionMethods } from '../test-utils';

describe('useUpdateMutation', () => {
  let mockPocketBase: PocketBase;
  // biome-ignore lint/suspicious/noExplicitAny: Mock function type
  let mockUpdate: any;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
    const methods = getMockCollectionMethods(mockPocketBase);
    mockUpdate = methods.update;
  });

  it('should return initial state', () => {
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useUpdateMutation('test', '1'), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useUpdateMutation('test', '1'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });

  it('should handle null id', async () => {
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useUpdateMutation('test', null), { wrapper });

    await expect(result.current.mutateAsync({ title: 'Test' })).rejects.toThrow('ID is required');
  });

  describe('mutateAsync', () => {
    it('should handle successful update', async () => {
      const mockData = { id: '1', title: 'Updated Item' };
      mockUpdate.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useUpdateMutation('test', '1'), { wrapper });

      const mutationResult = await result.current.mutateAsync({
        title: 'Updated Item',
      });

      expect(mockUpdate).toHaveBeenCalledWith('1', {
        title: 'Updated Item',
      });
      expect(mutationResult).toEqual(mockData);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle update with options', async () => {
      const mockData = { id: '1', title: 'Updated Item' };
      mockUpdate.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useUpdateMutation('test', '1'), { wrapper });

      const options = { expand: 'relation' };
      await result.current.mutateAsync({ title: 'Updated Item' }, options);

      expect(mockUpdate).toHaveBeenCalledWith('1', { title: 'Updated Item' }, options);
    });

    it('should handle mutation error', async () => {
      const mockError = new Error('Update failed');
      mockUpdate.mockRejectedValue(mockError);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useUpdateMutation('test', '1'), { wrapper });

      await expect(result.current.mutateAsync({ title: 'Test' })).rejects.toThrow('Update failed');

      await waitFor(() => {
        expect(result.current.error).toEqual('Update failed');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockUpdate.mockRejectedValue('String error');

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useUpdateMutation('test', '1'), { wrapper });

      await expect(result.current.mutateAsync({ title: 'Test' })).rejects.toThrow('Error updating record');

      await waitFor(() => {
        expect(result.current.error).toBe('Error updating record');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });

    it('should set isPending to true during mutation', async () => {
      let resolveUpdate: (value: unknown) => void = () => {};
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });
      mockUpdate.mockReturnValue(updatePromise);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useUpdateMutation('test', '1'), { wrapper });

      const mutationPromise = result.current.mutateAsync({ title: 'Test' });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
        expect(result.current.isSuccess).toBe(false);
      });

      resolveUpdate({ id: '1', title: 'Test' });
      await mutationPromise;

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('mutate', () => {
    it('should handle successful update', async () => {
      const mockData = { id: '1', title: 'Updated Item' };
      mockUpdate.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useUpdateMutation('test', '1'), { wrapper });

      const mutateResult = result.current.mutate({ title: 'Updated Item' });
      expect(mutateResult).toBeUndefined();

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith('1', { title: 'Updated Item' });
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle update with options', async () => {
      const mockData = { id: '1', title: 'Updated Item' };
      mockUpdate.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useUpdateMutation('test', '1'), { wrapper });

      const options = { expand: 'relation' };
      result.current.mutate({ title: 'Updated Item' }, options);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith('1', { title: 'Updated Item' }, options);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle mutation error', async () => {
      const mockError = new Error('Update failed');
      mockUpdate.mockRejectedValue(mockError);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useUpdateMutation('test', '1'), { wrapper });

      result.current.mutate({ title: 'Test' });

      await waitFor(() => {
        expect(result.current.error).toEqual('Update failed');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockUpdate.mockRejectedValue('String error');

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useUpdateMutation('test', '1'), { wrapper });

      result.current.mutate({ title: 'Test' });

      await waitFor(() => {
        expect(result.current.error).toBe('Error updating record');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
