import { renderHook, waitFor } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCreateMutation } from '../../src/hooks/useCreateMutation';
import { createMockPocketBase, createWrapper, getMockCollectionMethods } from '../test-utils';

describe('useCreateMutation', () => {
  let mockPocketBase: PocketBase;
  let mockCreate: any;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
    const methods = getMockCollectionMethods(mockPocketBase);
    mockCreate = methods.create;
  });

  it('should return initial state', () => {
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useCreateMutation('test'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });

  describe('mutateAsync', () => {
    it('should handle successful create', async () => {
      const mockData = { id: '1', title: 'New Item' };
      mockCreate.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

      const mutationResult = await result.current.mutateAsync({
        title: 'New Item',
      });

      expect(mockCreate).toHaveBeenCalledWith({ title: 'New Item' });
      expect(mutationResult).toEqual(mockData);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle create with options', async () => {
      const mockData = { id: '1', title: 'New Item' };
      mockCreate.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

      const options = { expand: 'relation' };
      await result.current.mutateAsync({ title: 'New Item' }, options);

      expect(mockCreate).toHaveBeenCalledWith({ title: 'New Item' }, options);
    });

    it('should handle mutation error', async () => {
      const mockError = new Error('Create failed');
      mockCreate.mockRejectedValue(mockError);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

      await expect(result.current.mutateAsync({ title: 'Test' })).rejects.toThrow('Create failed');

      await waitFor(() => {
        expect(result.current.error).toEqual('Create failed');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockCreate.mockRejectedValue('String error');

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

      await expect(result.current.mutateAsync({ title: 'Test' })).rejects.toThrow('Error creating record');

      await waitFor(() => {
        expect(result.current.error).toBe('Error creating record');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });

    it('should set isPending to true during mutation', async () => {
      let resolveCreate: (value: unknown) => void = () => {};
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });
      mockCreate.mockReturnValue(createPromise);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

      const mutationPromise = result.current.mutateAsync({ title: 'Test' });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
        expect(result.current.isSuccess).toBe(false);
      });

      resolveCreate({ id: '1', title: 'Test' });
      await mutationPromise;

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('mutate', () => {
    it('should handle successful create', async () => {
      const mockData = { id: '1', title: 'New Item' };
      mockCreate.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

      const mutateResult = result.current.mutate({ title: 'New Item' });
      expect(mutateResult).toBeUndefined();

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({ title: 'New Item' });
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle create with options', async () => {
      const mockData = { id: '1', title: 'New Item' };
      mockCreate.mockResolvedValue(mockData);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

      const options = { expand: 'relation' };
      result.current.mutate({ title: 'New Item' }, options);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({ title: 'New Item' }, options);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle mutation error', async () => {
      const mockError = new Error('Create failed');
      mockCreate.mockRejectedValue(mockError);

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

      result.current.mutate({ title: 'Test' });

      await waitFor(() => {
        expect(result.current.error).toEqual('Create failed');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockCreate.mockRejectedValue('String error');

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

      result.current.mutate({ title: 'Test' });

      await waitFor(() => {
        expect(result.current.error).toBe('Error creating record');
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
