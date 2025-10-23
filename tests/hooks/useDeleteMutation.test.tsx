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

    const { result } = renderHook(() => useDeleteMutation('test', '1'), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useDeleteMutation('test', '1'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });

  it('should handle null id', async () => {
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useDeleteMutation('test', null), { wrapper });

    await expect(result.current.mutateAsync()).rejects.toThrow('ID is required');
  });

  describe('mutateAsync', () => {
    it('should handle successful delete', async () => {
      mockDelete.mockResolvedValue(true);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useDeleteMutation('test', '1'), { wrapper });

      await result.current.mutateAsync();

      expect(mockDelete).toHaveBeenCalledWith('1', undefined);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle delete with options', async () => {
      mockDelete.mockResolvedValue(true);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useDeleteMutation('test', '1'), { wrapper });

      const options = { headers: { 'X-Custom': 'value' } };

      await result.current.mutateAsync(options);
      expect(mockDelete).toHaveBeenCalledWith('1', options);
    });

    it('should handle mutation error', async () => {
      const mockError = new Error('Delete failed');
      mockDelete.mockRejectedValue(mockError);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useDeleteMutation('test', '1'), { wrapper });

      await expect(result.current.mutateAsync()).rejects.toThrow('Delete failed');

      await waitFor(() => {
        expect(result.current.error).toEqual('Delete failed');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockDelete.mockRejectedValue('String error');

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useDeleteMutation('test', '1'), { wrapper });

      await expect(result.current.mutateAsync()).rejects.toThrow('Error deleting record');

      await waitFor(() => {
        expect(result.current.error).toBe('Error deleting record');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });

    it('should set isPending to true during mutation', async () => {
      let resolveDelete: (value: unknown) => void = () => {};
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve;
      });
      mockDelete.mockReturnValue(deletePromise);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useDeleteMutation('test', '1'), { wrapper });

      const mutationPromise = result.current.mutateAsync();

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
        expect(result.current.isSuccess).toBe(false);
      });

      resolveDelete(true);
      await mutationPromise;

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('mutate', () => {
    it('should handle successful delete', async () => {
      mockDelete.mockResolvedValue(true);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useDeleteMutation('test', '1'), { wrapper });

      const mutateResult = result.current.mutate();
      expect(mutateResult).toBeUndefined();

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('1', undefined);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle delete with options', async () => {
      mockDelete.mockResolvedValue(true);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useDeleteMutation('test', '1'), { wrapper });

      const options = { headers: { 'X-Custom': 'value' } };
      result.current.mutate(options);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('1', options);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle mutation error', async () => {
      const mockError = new Error('Delete failed');
      mockDelete.mockRejectedValue(mockError);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useDeleteMutation('test', '1'), { wrapper });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.error).toEqual('Delete failed');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockDelete.mockRejectedValue('String error');

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useDeleteMutation('test', '1'), { wrapper });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.error).toBe('Error deleting record');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
