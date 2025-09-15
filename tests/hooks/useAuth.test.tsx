import { act, renderHook } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../src/hooks/useAuth';
import { PocketBaseProvider } from '../../src/providers/PocketBaseProvider';

// Mock PocketBase with auth methods
const createMockPocketBase = (initialAuth: { isValid: boolean; record: unknown } = { isValid: false, record: null }) => {
  const authState = initialAuth;
  const listeners: Array<(token: string | null, model: unknown) => void> = [];

  return {
    baseURL: 'http://localhost:8090',
    authStore: {
      get isValid() {
        return authState.isValid;
      },
      get record() {
        return authState.record;
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
      authWithOAuth2: vi.fn(),
      create: vi.fn(),
      authRefresh: vi.fn(),
      subscribe: vi.fn(() => Promise.resolve(() => {})),
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

  it('should handle signIn with email (basic)', async () => {
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
      await result.current.signIn.email('test@example.com', 'password');
    });

    expect(mockAuth).toHaveBeenCalledWith('test@example.com', 'password', undefined);
  });

  it('should handle signIn with email (with options)', async () => {
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

    const options = { expand: 'profile' };

    await act(async () => {
      await result.current.signIn.email('test@example.com', 'password', options);
    });

    expect(mockAuth).toHaveBeenCalledWith('test@example.com', 'password', options);
  });

  it('should handle signIn with social provider (basic)', async () => {
    const mockAuthResponse = {
      token: 'mock-token',
      record: { id: '1', email: 'test@example.com' },
    };

    const mockAuth = vi.fn().mockResolvedValue(mockAuthResponse);
    mockPocketBase.collection = vi.fn().mockReturnValue({
      authWithOAuth2: mockAuth,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn.social('google');
    });

    expect(mockAuth).toHaveBeenCalledWith({ provider: 'google' });
  });

  it('should handle signIn with social provider (with scopes)', async () => {
    const mockAuthResponse = {
      token: 'mock-token',
      record: { id: '1', email: 'test@example.com' },
    };

    const mockAuth = vi.fn().mockResolvedValue(mockAuthResponse);
    mockPocketBase.collection = vi.fn().mockReturnValue({
      authWithOAuth2: mockAuth,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn.social('github', {
        scopes: ['user:email', 'read:user'],
      });
    });

    expect(mockAuth).toHaveBeenCalledWith({
      provider: 'github',
      scopes: ['user:email', 'read:user'],
    });
  });

  it('should handle signIn with social provider (with createData)', async () => {
    const mockAuthResponse = {
      token: 'mock-token',
      record: { id: '1', email: 'test@example.com' },
    };

    const mockAuth = vi.fn().mockResolvedValue(mockAuthResponse);
    mockPocketBase.collection = vi.fn().mockReturnValue({
      authWithOAuth2: mockAuth,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn.social('discord', {
        createData: {
          name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
        },
      });
    });

    expect(mockAuth).toHaveBeenCalledWith({
      provider: 'discord',
      createData: {
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
      },
    });
  });

  it('should handle signIn with social provider (with urlCallback)', async () => {
    const mockAuthResponse = {
      token: 'mock-token',
      record: { id: '1', email: 'test@example.com' },
    };

    const mockAuth = vi.fn().mockResolvedValue(mockAuthResponse);
    mockPocketBase.collection = vi.fn().mockReturnValue({
      authWithOAuth2: mockAuth,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    const urlCallback = vi.fn();

    await act(async () => {
      await result.current.signIn.social('google', {
        urlCallback,
      });
    });

    expect(mockAuth).toHaveBeenCalledWith({
      provider: 'google',
      urlCallback,
    });
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

  it('should handle signUp with email (basic)', async () => {
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
      await result.current.signUp.email('new@example.com', 'password');
    });

    expect(mockAutoCancellation).toHaveBeenCalledWith(false);
    expect(mockCreate).toHaveBeenCalledWith(
      {
        email: 'new@example.com',
        password: 'password',
      },
      {},
    );
  });

  it('should handle signUp with email (with additionalData)', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: '1',
      email: 'new@example.com',
      name: 'John Doe',
    });

    const mockAutoCancellation = vi.fn().mockReturnValue({
      collection: vi.fn().mockReturnValue({
        create: mockCreate,
      }),
    });

    mockPocketBase.autoCancellation = mockAutoCancellation;

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    const options = {
      additionalData: { name: 'John Doe' },
      expand: 'profile',
    };

    await act(async () => {
      await result.current.signUp.email('new@example.com', 'password', options);
    });

    expect(mockAutoCancellation).toHaveBeenCalledWith(false);
    expect(mockCreate).toHaveBeenCalledWith(
      {
        email: 'new@example.com',
        password: 'password',
        name: 'John Doe',
      },
      options,
    );
  });

  it('should return loading state when isLoading is true', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Simulate loading state by calling signIn.email
    act(() => {
      result.current.signIn.email('test@example.com', 'password');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return error state when error is present', async () => {
    const mockError = new Error('Auth failed');
    const mockAuth = vi.fn().mockRejectedValue(mockError);
    mockPocketBase.collection = vi.fn().mockReturnValue({
      authWithPassword: mockAuth,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn.email('test@example.com', 'password');
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return authenticated state when user is present', () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockPocketBaseWithUser = createMockPocketBase({
      isValid: true,
      record: mockUser,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBaseWithUser}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
