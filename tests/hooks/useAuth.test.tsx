import { renderHook, waitFor } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../src/hooks/useAuth';
import { createMockAuthPocketBase, createWrapper } from '../test-utils';

describe('useAuth', () => {
  let mockPocketBase: PocketBase;
  const emptyFn = vi.fn();

  beforeEach(() => {
    mockPocketBase = createMockAuthPocketBase();
  });

  it('should return initial auth state', () => {
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should return loading state when isLoading is true', () => {
    const mockAuth = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              record: { id: '1', email: 'test@example.com' },
              token: null,
            });
          }, 100);
        }),
    );
    mockPocketBase.collection = vi.fn().mockReturnValue({
      authWithPassword: mockAuth,
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);

    return waitFor(() => {
      result.current.signIn.email('test@example.com', 'password');
      expect(result.current.isLoading).toBe(true);
    });
  });

  it('should return error state when error is present', async () => {
    const mockError = new Error('Auth failed');
    const mockAuth = vi.fn().mockRejectedValue(mockError);
    mockPocketBase.collection = vi.fn().mockReturnValue({
      authWithPassword: mockAuth,
    });

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.signIn.email('test@example.com', 'password');

    return waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('should return authenticated state when user is present', () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockPocketBaseWithUser = createMockAuthPocketBase({
      isValid: true,
      record: mockUser,
    });

    const wrapper = createWrapper(mockPocketBaseWithUser);

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

  it('should accept custom collectionName option', () => {
    const mockPocketBase = createMockAuthPocketBase();
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useAuth({ collectionName: 'custom_users' }), { wrapper });

    expect(result.current.user).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should listen to authStore changes', () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const listeners: Array<(token: string | null, model: unknown) => void> = [];

    const mockPocketBase = {
      authStore: {
        isValid: false,
        record: null,
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
        subscribe: vi.fn(() => Promise.resolve(() => {})),
      }),
    } as unknown as PocketBase;

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBe(null);

    listeners.forEach((listener) => {
      listener('mock-token', mockUser);
    });

    return waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('realtime', () => {
    it.each`
      scenario      | realtime
      ${'explicit'} | ${true}
      ${'default'}  | ${undefined}
    `('should subscribe to user record updates $scenario', async ({ realtime }) => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockPocketBaseWithUser = createMockAuthPocketBase({
        isValid: true,
        record: mockUser,
      });

      const mockSubscribe = vi.fn(() => Promise.resolve(() => {}));
      mockPocketBaseWithUser.collection = vi.fn().mockReturnValue({
        subscribe: mockSubscribe,
      });

      const wrapper = createWrapper(mockPocketBaseWithUser);

      renderHook(() => useAuth({ realtime }), { wrapper });

      expect(mockSubscribe).toHaveBeenCalledWith('1', expect.any(Function));
    });

    it('should not subscribe to user record updates when realtime is false', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockPocketBaseWithUser = createMockAuthPocketBase({
        isValid: true,
        record: mockUser,
      });

      const mockSubscribe = vi.fn(() => Promise.resolve(() => {}));
      mockPocketBaseWithUser.collection = vi.fn().mockReturnValue({
        subscribe: mockSubscribe,
      });

      const wrapper = createWrapper(mockPocketBaseWithUser);

      renderHook(() => useAuth({ realtime: false }), { wrapper });

      expect(mockSubscribe).not.toHaveBeenCalled();
    });

    it('should not handle user deletion via subscription when realtime is false', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };

      const mockPocketBaseWithUser = createMockAuthPocketBase({
        isValid: true,
        record: mockUser,
      });

      mockPocketBaseWithUser.collection = vi.fn().mockReturnValue({
        subscribe: vi.fn(() => Promise.resolve(() => {})),
      });

      const wrapper = createWrapper(mockPocketBaseWithUser);

      const { result } = renderHook(() => useAuth({ realtime: false }), { wrapper });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('signIn', () => {
    it.each`
      scenario          | options                  | expected
      ${'basic'}        | ${undefined}             | ${undefined}
      ${'with options'} | ${{ expand: 'profile' }} | ${{ expand: 'profile' }}
    `('should handle signIn with email $scenario', async ({ options, expected }) => {
      const mockAuthResponse = {
        token: 'mock-token',
        record: { id: '1', email: 'test@example.com' },
      };

      const mockAuth = vi.fn().mockResolvedValue(mockAuthResponse);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        authWithPassword: mockAuth,
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.signIn.email('test@example.com', 'password', options);

      return waitFor(() => {
        expect(mockAuth).toHaveBeenCalledWith('test@example.com', 'password', expected);
      });
    });

    it.each`
      scenario              | options                                                                           | expected
      ${'basic'}            | ${undefined}                                                                      | ${undefined}
      ${'with scopes'}      | ${{ scopes: ['user:email', 'read:user'] }}                                        | ${{ scopes: ['user:email', 'read:user'] }}
      ${'with createData'}  | ${{ createData: { name: 'John Doe', avatar: 'https://example.com/avatar.jpg' } }} | ${{ createData: { name: 'John Doe', avatar: 'https://example.com/avatar.jpg' } }}
      ${'with urlCallback'} | ${{ urlCallback: emptyFn }}                                                       | ${{ urlCallback: emptyFn }}
    `('should handle signIn with social provider $scenario', async ({ options, expected }) => {
      const mockAuthResponse = {
        token: 'mock-token',
        record: { id: '1', email: 'test@example.com' },
      };

      const mockAuth = vi.fn().mockResolvedValue(mockAuthResponse);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        authWithOAuth2: mockAuth,
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.signIn.social('google', options);

      return waitFor(() => {
        expect(mockAuth).toHaveBeenCalledWith({ provider: 'google', ...expected });
      });
    });

    it.each`
      scenario          | options                  | expected
      ${'basic'}        | ${undefined}             | ${undefined}
      ${'with options'} | ${{ expand: 'profile' }} | ${{ expand: 'profile' }}
    `('should handle signIn with OTP $scenario', async ({ options, expected }) => {
      const mockAuthResponse = {
        token: 'mock-token',
        record: { id: '1', email: 'test@example.com' },
      };

      const mockAuth = vi.fn().mockResolvedValue(mockAuthResponse);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        authWithOTP: mockAuth,
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.signIn.otp('123456', 'password', options);

      return waitFor(() => {
        expect(mockAuth).toHaveBeenCalledWith('123456', 'password', expected);
      });
    });
  });

  describe('signOut', () => {
    it('should handle signOut', () => {
      const mockClear = vi.fn();
      mockPocketBase.authStore = {
        ...mockPocketBase.authStore,
        clear: mockClear,
      } as unknown as typeof mockPocketBase.authStore;

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      return waitFor(() => {
        result.current.signOut();

        expect(mockClear).toHaveBeenCalled();
      });
    });
  });

  describe('signUp', () => {
    it.each`
      scenario          | options                                                        | expected
      ${'basic'}        | ${undefined}                                                   | ${undefined}
      ${'with options'} | ${{ expand: 'profile', additionalData: { name: 'John Doe' } }} | ${{ expand: 'profile', additionalData: { name: 'John Doe' } }}
    `('should handle signUp with email $scenario', async ({ options, expected }) => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: '1',
        email: 'new@example.com',
        name: 'John Doe',
      });

      mockPocketBase.collection('users').create = mockCreate;

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.signUp.email('new@example.com', 'password', options);

      return waitFor(() => {
        const { additionalData, ...rest } = expected ?? {};
        expect(mockCreate).toHaveBeenCalledWith(
          {
            email: 'new@example.com',
            password: 'password',
            ...additionalData,
          },
          rest,
        );
      });
    });
  });

  describe('passwordReset', () => {
    it.each`
      scenario          | options                  | expected
      ${'basic'}        | ${undefined}             | ${undefined}
      ${'with options'} | ${{ expand: 'profile' }} | ${{ expand: 'profile' }}
    `('should request password reset $scenario', async ({ options, expected }) => {
      const mockPocketBase = createMockAuthPocketBase();
      const mockRequestPasswordReset = vi.fn().mockResolvedValue(undefined);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        requestPasswordReset: mockRequestPasswordReset,
        confirmPasswordReset: vi.fn(),
        authWithPassword: vi.fn(),
        authWithOAuth2: vi.fn(),
        create: vi.fn(),
        subscribe: vi.fn().mockResolvedValue(() => {}),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.passwordReset.request('test@example.com', options);

      return waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com', expected);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it.each`
      scenario          | options                  | expected
      ${'basic'}        | ${undefined}             | ${undefined}
      ${'with options'} | ${{ expand: 'profile' }} | ${{ expand: 'profile' }}
    `('should confirm password reset $scenario', async ({ options, expected }) => {
      const mockPocketBase = createMockAuthPocketBase();
      const mockConfirmPasswordReset = vi.fn().mockResolvedValue(undefined);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        requestPasswordReset: vi.fn(),
        confirmPasswordReset: mockConfirmPasswordReset,
        authWithPassword: vi.fn(),
        authWithOAuth2: vi.fn(),
        create: vi.fn(),
        subscribe: vi.fn().mockResolvedValue(() => {}),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.passwordReset.confirm('token123', 'newpassword', 'newpassword', options);

      return waitFor(() => {
        expect(mockConfirmPasswordReset).toHaveBeenCalledWith('token123', 'newpassword', 'newpassword', expected);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it.each`
      scenario          | options
      ${'basic'}        | ${undefined}
      ${'with options'} | ${{ expand: 'profile' }}
    `('should handle password reset request error $scenario', async ({ options }) => {
      const mockPocketBase = createMockAuthPocketBase();
      const mockError = new Error('Password reset failed');
      const mockRequestPasswordReset = vi.fn().mockRejectedValue(mockError);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        requestPasswordReset: mockRequestPasswordReset,
        confirmPasswordReset: vi.fn(),
        authWithPassword: vi.fn(),
        authWithOAuth2: vi.fn(),
        create: vi.fn(),
        subscribe: vi.fn().mockResolvedValue(() => {}),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.passwordReset.request('test@example.com', options);

      return waitFor(() => {
        expect(result.current.error).toBe(mockError);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it.each`
      scenario          | options
      ${'basic'}        | ${undefined}
      ${'with options'} | ${{ expand: 'profile' }}
    `('should handle password reset confirm error $scenario', async ({ options }) => {
      const mockPocketBase = createMockAuthPocketBase();
      const mockError = new Error('Password reset confirmation failed');
      const mockConfirmPasswordReset = vi.fn().mockRejectedValue(mockError);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        requestPasswordReset: vi.fn(),
        confirmPasswordReset: mockConfirmPasswordReset,
        authWithPassword: vi.fn(),
        authWithOAuth2: vi.fn(),
        create: vi.fn(),
        subscribe: vi.fn().mockResolvedValue(() => {}),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.passwordReset.confirm('token123', 'newpassword', 'newpassword', options);

      return waitFor(() => {
        expect(result.current.error).toBe(mockError);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('verification', () => {
    it.each`
      scenario          | options                  | expected
      ${'basic'}        | ${undefined}             | ${undefined}
      ${'with options'} | ${{ expand: 'profile' }} | ${{ expand: 'profile' }}
    `('should request email verification $scenario', async ({ options, expected }) => {
      const mockPocketBase = createMockAuthPocketBase();
      const mockRequestVerification = vi.fn().mockResolvedValue(undefined);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        requestVerification: mockRequestVerification,
        confirmVerification: vi.fn(),
        authWithPassword: vi.fn(),
        authWithOAuth2: vi.fn(),
        create: vi.fn(),
        subscribe: vi.fn().mockResolvedValue(() => {}),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.verification.request('test@example.com', options);

      return waitFor(() => {
        expect(mockRequestVerification).toHaveBeenCalledWith('test@example.com', expected);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it.each`
      scenario          | options                  | expected
      ${'basic'}        | ${undefined}             | ${undefined}
      ${'with options'} | ${{ expand: 'profile' }} | ${{ expand: 'profile' }}
    `('should confirm email verification $scenario', async ({ options, expected }) => {
      const mockPocketBase = createMockAuthPocketBase();
      const mockConfirmVerification = vi.fn().mockResolvedValue(undefined);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        requestVerification: vi.fn(),
        confirmVerification: mockConfirmVerification,
        authWithPassword: vi.fn(),
        authWithOAuth2: vi.fn(),
        create: vi.fn(),
        subscribe: vi.fn().mockResolvedValue(() => {}),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.verification.confirm('token123', options);

      return waitFor(() => {
        expect(mockConfirmVerification).toHaveBeenCalledWith('token123', expected);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it.each`
      scenario          | options
      ${'basic'}        | ${undefined}
      ${'with options'} | ${{ expand: 'profile' }}
    `('should handle verification request error $scenario', async ({ options }) => {
      const mockPocketBase = createMockAuthPocketBase();
      const mockError = new Error('Verification request failed');
      const mockRequestVerification = vi.fn().mockRejectedValue(mockError);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        requestVerification: mockRequestVerification,
        confirmVerification: vi.fn(),
        authWithPassword: vi.fn(),
        authWithOAuth2: vi.fn(),
        create: vi.fn(),
        subscribe: vi.fn().mockResolvedValue(() => {}),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.verification.request('test@example.com', options);

      return waitFor(() => {
        expect(result.current.error).toBe(mockError);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it.each`
      scenario          | options
      ${'basic'}        | ${undefined}
      ${'with options'} | ${{ expand: 'profile' }}
    `('should handle verification confirm error $scenario', async ({ options }) => {
      const mockPocketBase = createMockAuthPocketBase();
      const mockError = new Error('Verification confirmation failed');
      const mockConfirmVerification = vi.fn().mockRejectedValue(mockError);
      mockPocketBase.collection = vi.fn().mockReturnValue({
        requestVerification: vi.fn(),
        confirmVerification: mockConfirmVerification,
        authWithPassword: vi.fn(),
        authWithOAuth2: vi.fn(),
        create: vi.fn(),
        subscribe: vi.fn().mockResolvedValue(() => {}),
      });

      const wrapper = createWrapper(mockPocketBase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.verification.confirm('token123', options);

      return waitFor(() => {
        expect(result.current.error).toBe(mockError);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
