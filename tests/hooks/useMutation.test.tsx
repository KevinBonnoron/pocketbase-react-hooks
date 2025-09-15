import { act, renderHook } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMutation } from '../../src/hooks/useMutation';
import { PocketBaseProvider } from '../../src/providers/PocketBaseProvider';

// Mock PocketBase
const createMockPocketBase = () => {
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  return {
    baseURL: 'http://localhost:8090',
    collection: vi.fn().mockReturnValue({
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    }),
    authStore: {
      isValid: false,
      model: null,
      onChange: vi.fn(() => () => {}),
    },
  } as unknown as PocketBase;
};

describe('useMutation', () => {
  let mockPocketBase: PocketBase;
  let mockCreate: any;
  let mockUpdate: any;
  let mockDelete: any;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
    const collection = mockPocketBase.collection('test');
    mockCreate = collection.create;
    mockUpdate = collection.update;
    mockDelete = collection.delete;
  });

  it('should return initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.create).toBe('function');
    expect(typeof result.current.update).toBe('function');
    expect(typeof result.current.remove).toBe('function');
  });

  it('should handle create mutation', async () => {
    const mockData = { id: '1', title: 'New Item' };
    mockCreate.mockResolvedValue(mockData);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.create({
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
  });

  it('should handle update mutation', async () => {
    const mockData = { id: '1', title: 'Updated Item' };
    mockUpdate.mockResolvedValue(mockData);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.update('1', {
        title: 'Updated Item',
      });
    });

    expect(mockUpdate).toHaveBeenCalledWith('1', {
      title: 'Updated Item',
    });
    expect(mutationResult).toEqual(mockData);
  });

  it('should handle delete mutation', async () => {
    mockDelete.mockResolvedValue(true);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.remove('1');
    });

    expect(mockDelete).toHaveBeenCalledWith('1', undefined);
    expect(mutationResult).toBe(true);
  });

  it('should handle mutation error', async () => {
    const mockError = new Error('Mutation failed');
    mockCreate.mockRejectedValue(mockError);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    await act(async () => {
      await result.current.create({ title: 'Test' });
    });

    expect(result.current.error).toEqual('Mutation failed');
    expect(result.current.isPending).toBe(false);
  });

  it('should handle non-Error exceptions in create', async () => {
    mockCreate.mockRejectedValue('String error');

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    await act(async () => {
      await result.current.create({ title: 'Test' });
    });

    expect(result.current.error).toBe('Error creating record');
    expect(result.current.isPending).toBe(false);
  });

  it('should handle non-Error exceptions in update', async () => {
    mockUpdate.mockRejectedValue('String error');

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    await act(async () => {
      await result.current.update('1', { title: 'Test' });
    });

    expect(result.current.error).toBe('Error updating record');
    expect(result.current.isPending).toBe(false);
  });

  it('should handle non-Error exceptions in remove', async () => {
    mockDelete.mockRejectedValue('String error');

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    await act(async () => {
      await result.current.remove('1');
    });

    expect(result.current.error).toBe('Error deleting record');
    expect(result.current.isPending).toBe(false);
  });

  it('should set isPending to true during mutation', async () => {
    let resolveCreate: (value: unknown) => void;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    mockCreate.mockReturnValue(createPromise);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    act(() => {
      result.current.create({ title: 'Test' });
    });

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      resolveCreate({ id: '1', title: 'Test' });
      await createPromise;
    });

    expect(result.current.isPending).toBe(false);
  });

  it('should set isSuccess to true after successful mutation', async () => {
    const mockData = { id: '1', title: 'New Item' };
    mockCreate.mockResolvedValue(mockData);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    await act(async () => {
      await result.current.create({ title: 'New Item' });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('should set isError to true after failed mutation', async () => {
    const mockError = new Error('Mutation failed');
    mockCreate.mockRejectedValue(mockError);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    await act(async () => {
      await result.current.create({ title: 'Test' });
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.isSuccess).toBe(false);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useMutation('test'));
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
