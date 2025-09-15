import { act, renderHook } from '@testing-library/react';
import type Pocketbase from 'pocketbase';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../src/hooks/useAuth';
import { PocketbaseProvider } from '../../src/providers/PocketbaseProvider';

// Mock Pocketbase with auth methods
const createMockPocketbase = (initialAuth: { isValid: boolean; model: unknown } = { isValid: false, model: null }) => {
  const authState = initialAuth;
  const listeners: Array<(token: string | null, model: unknown) => void> = [];

  return {
    baseURL: 'http://localhost:8090',
    authStore: {
      get isValid() {
        return authState.isValid;
      },
      get model() {
        return authState.model;
      },
      onChange: vi.fn((callback: (token: string | null, model: unknown) => void) => {
        listeners.push(callback);
        return () => {
          const index = listeners.indexOf(callback);
          if (index > -1) listeners.splice(index, 1);
        };
      }),
      clear: vi.fn(),
    },
    collection: vi.fn().mockReturnValue({
      authWithPassword: vi.fn(),
      create: vi.fn(),
      authRefresh: vi.fn(),
    }),
  } as unknown as Pocketbase;
};

describe('useAuth', () => {
  let mockPocketbase: Pocketbase;

  beforeEach(() => {
    mockPocketbase = createMockPocketbase();
  });

  it('should return initial auth state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle signIn', async () => {
    const mockAuthResponse = {
      token: 'mock-token',
      record: { id: '1', email: 'test@example.com' },
    };

    const mockAuth = vi.fn().mockResolvedValue(mockAuthResponse);
    mockPocketbase.collection = vi.fn().mockReturnValue({
      authWithPassword: mockAuth,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(mockAuth).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should handle signOut', async () => {
    const mockClear = vi.fn();
    mockPocketbase.authStore = {
      ...mockPocketbase.authStore,
      clear: mockClear,
    } as unknown as typeof mockPocketbase.authStore;

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      result.current.signOut();
    });

    expect(mockClear).toHaveBeenCalled();
  });

  it('should handle signUp', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: '1',
      email: 'new@example.com',
    });

    const mockAutoCancellation = vi.fn().mockReturnValue({
      collection: vi.fn().mockReturnValue({
        create: mockCreate,
      }),
    });

    mockPocketbase.autoCancellation = mockAutoCancellation;

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signUp('new@example.com', 'password', 'password');
    });

    expect(mockAutoCancellation).toHaveBeenCalledWith(false);
    expect(mockCreate).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password',
      passwordConfirm: 'password',
      role: 'user',
    });
  });

  it('should handle update user data', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'John' };
    const mockUpdatedUser = { id: '1', email: 'test@example.com', name: 'John Updated' };

    const mockUpdate = vi.fn().mockResolvedValue(mockUpdatedUser);

    mockPocketbase.collection = vi.fn().mockReturnValue({
      update: mockUpdate,
    });

    const mockPocketbaseWithUser = createMockPocketbase({
      isValid: true,
      model: mockUser,
    });
    mockPocketbaseWithUser.collection = vi.fn().mockReturnValue({
      update: mockUpdate,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbaseWithUser}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const updatedUser = await result.current.update({ name: 'John Updated' });
      expect(updatedUser).toEqual(mockUpdatedUser);
    });

    expect(mockUpdate).toHaveBeenCalledWith('1', { name: 'John Updated' });
  });

  it('should throw error when updating without user', async () => {
    const mockUpdate = vi.fn();

    mockPocketbase.collection = vi.fn().mockReturnValue({
      update: mockUpdate,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.update({ name: 'John Updated' })).rejects.toThrow('User not found');
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('usePocketbase must be used within a PocketbaseProvider');
  });
});
