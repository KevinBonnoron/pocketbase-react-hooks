import { act, renderHook } from '@testing-library/react';
import type Pocketbase from 'pocketbase';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMutation } from '../../src/hooks/useMutation';
import { PocketbaseProvider } from '../../src/providers/PocketbaseProvider';

// Mock Pocketbase
const createMockPocketbase = () => {
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
  } as unknown as Pocketbase;
};

describe('useMutation', () => {
  let mockPocketbase: Pocketbase;
  let mockCreate: any;
  let mockUpdate: any;
  let mockDelete: any;

  beforeEach(() => {
    mockPocketbase = createMockPocketbase();
    const collection = mockPocketbase.collection('test');
    mockCreate = collection.create;
    mockUpdate = collection.update;
    mockDelete = collection.delete;
  });

  it('should return initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

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

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.create({
        title: 'New Item',
      });
    });

    expect(mockCreate).toHaveBeenCalledWith({
      title: 'New Item',
    });
    expect(mutationResult).toEqual(mockData);
    expect(result.current.isPending).toBe(false);
  });

  it('should handle update mutation', async () => {
    const mockData = { id: '1', title: 'Updated Item' };
    mockUpdate.mockResolvedValue(mockData);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

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

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.remove('1');
    });

    expect(mockDelete).toHaveBeenCalledWith('1');
    expect(mutationResult).toBe(true);
  });

  it('should handle mutation error', async () => {
    const mockError = new Error('Mutation failed');
    mockCreate.mockRejectedValue(mockError);

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useMutation('test'), { wrapper });

    await act(async () => {
      await result.current.create({ title: 'Test' });
    });

    expect(result.current.error).toEqual('Mutation failed');
    expect(result.current.isPending).toBe(false);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useMutation('test'));
    }).toThrow('usePocketbase must be used within a PocketbaseProvider');
  });
});
