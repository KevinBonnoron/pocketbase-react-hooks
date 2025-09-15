import { act, renderHook } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUpdateMutation } from '../../src/hooks/useUpdateMutation';
import { PocketBaseProvider } from '../../src/providers/PocketBaseProvider';

const createMockPocketBase = () => {
  const mockUpdate = vi.fn();

  return {
    baseURL: 'http://localhost:8090',
    collection: vi.fn().mockReturnValue({
      update: mockUpdate,
    }),
    authStore: {
      isValid: false,
      model: null,
      onChange: vi.fn(() => () => {}),
    },
  } as unknown as PocketBase;
};

describe('useUpdateMutation', () => {
  let mockPocketBase: PocketBase;
  let mockUpdate: any;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
    const collection = mockPocketBase.collection('test');
    mockUpdate = collection.update;
  });

  it('should return initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isSuccess).toBe(true);
    expect(typeof result.current.mutate).toBe('function');
  });

  it('should handle update mutation', async () => {
    const mockData = { id: '1', title: 'Updated Item' };
    mockUpdate.mockResolvedValue(mockData);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.mutate('1', {
        title: 'Updated Item',
      });
    });

    expect(mockUpdate).toHaveBeenCalledWith('1', {
      title: 'Updated Item',
    });
    expect(mutationResult).toEqual(mockData);
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });

  it('should handle update mutation with options', async () => {
    const mockData = { id: '1', title: 'Updated Item' };
    mockUpdate.mockResolvedValue(mockData);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    const options = { expand: 'relation' };
    await act(async () => {
      await result.current.mutate('1', { title: 'Updated Item' }, options);
    });

    expect(mockUpdate).toHaveBeenCalledWith('1', { title: 'Updated Item' }, options);
  });

  it('should handle mutation error', async () => {
    const mockError = new Error('Update failed');
    mockUpdate.mockRejectedValue(mockError);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    await act(async () => {
      await result.current.mutate('1', { title: 'Test' });
    });

    expect(result.current.error).toEqual('Update failed');
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('should handle non-Error exceptions', async () => {
    mockUpdate.mockRejectedValue('String error');

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    await act(async () => {
      await result.current.mutate('1', { title: 'Test' });
    });

    expect(result.current.error).toBe('Error updating record');
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('should set isPending to true during mutation', async () => {
    let resolveUpdate: (value: unknown) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    mockUpdate.mockReturnValue(updatePromise);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useUpdateMutation('test'), { wrapper });

    act(() => {
      result.current.mutate('1', { title: 'Test' });
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isSuccess).toBe(false);

    await act(async () => {
      resolveUpdate({ id: '1', title: 'Test' });
      await updatePromise;
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useUpdateMutation('test'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
