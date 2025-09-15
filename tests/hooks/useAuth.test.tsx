import { act, renderHook } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../src/hooks/useAuth';
import { PocketBaseProvider } from '../../src/providers/PocketbaseProvider';

// Mock PocketBase with auth methods
const createMockPocketBase = (initialAuth: { isValid: boolean; model: unknown } = { isValid: false, model: null }) => {
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
  } as unknown as PocketBase;
};

describe('useAuth', () => {
  let mockPocketBase: PocketBase;

  beforeEach(() => {
    mockPocketBase = createMockPocketBase();
  });

  it('should return initial auth state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

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
    mockPocketBase.collection = vi.fn().mockReturnValue({
      authWithPassword: mockAuth,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(mockAuth).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should handle signOut', async () => {
    const mockClear = vi.fn();
    mockPocketBase.authStore = {
      ...mockPocketBase.authStore,
      clear: mockClear,
    } as unknown as typeof mockPocketBase.authStore;

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

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

    mockPocketBase.autoCancellation = mockAutoCancellation;

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

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

    mockPocketBase.collection = vi.fn().mockReturnValue({
      update: mockUpdate,
    });

    const mockPocketBaseWithUser = createMockPocketBase({
      isValid: true,
      model: mockUser,
    });
    mockPocketBaseWithUser.collection = vi.fn().mockReturnValue({
      update: mockUpdate,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBaseWithUser}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const updatedUser = await result.current.update({ name: 'John Updated' });
      expect(updatedUser).toEqual(mockUpdatedUser);
    });

    expect(mockUpdate).toHaveBeenCalledWith('1', { name: 'John Updated' });
  });

  it('should throw error when updating without user', async () => {
    const mockUpdate = vi.fn();

    mockPocketBase.collection = vi.fn().mockReturnValue({
      update: mockUpdate,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.update({ name: 'John Updated' })).rejects.toThrow('User not found');
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
