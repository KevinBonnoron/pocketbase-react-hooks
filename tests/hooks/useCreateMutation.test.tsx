import { act, renderHook } from '@testing-library/react';
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
    expect(typeof result.current.mutate).toBe('function');
  });

  it('should handle create mutation', async () => {
    const mockData = { id: '1', title: 'New Item' };
    mockCreate.mockResolvedValue(mockData);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.mutate({
        title: 'New Item',
      });
    });

    expect(mockCreate).toHaveBeenCalledWith(
      {
        title: 'New Item',
      },
      undefined,
    );
    expect(mutationResult).toEqual(mockData);
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });

  it('should handle create mutation with options', async () => {
    const mockData = { id: '1', title: 'New Item' };
    mockCreate.mockResolvedValue(mockData);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

    const options = { expand: 'relation' };
    await act(async () => {
      await result.current.mutate({ title: 'New Item' }, options);
    });

    expect(mockCreate).toHaveBeenCalledWith({ title: 'New Item' }, options);
  });

  it('should handle mutation error', async () => {
    const mockError = new Error('Create failed');
    mockCreate.mockRejectedValue(mockError);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

    await act(async () => {
      await result.current.mutate({ title: 'Test' });
    });

    expect(result.current.error).toEqual('Create failed');
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('should handle non-Error exceptions', async () => {
    mockCreate.mockRejectedValue('String error');

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

    await act(async () => {
      await result.current.mutate({ title: 'Test' });
    });

    expect(result.current.error).toBe('Error creating record');
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('should set isPending to true during mutation', async () => {
    let resolveCreate: (value: unknown) => void;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    mockCreate.mockReturnValue(createPromise);

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useCreateMutation('test'), { wrapper });

    act(() => {
      result.current.mutate({ title: 'Test' });
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isSuccess).toBe(false);

    await act(async () => {
      resolveCreate({ id: '1', title: 'Test' });
      await createPromise;
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useCreateMutation('test'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
