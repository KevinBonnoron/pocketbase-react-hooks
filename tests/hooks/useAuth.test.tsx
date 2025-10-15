import { act, renderHook } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../src/hooks/useAuth';
import { createMockAuthPocketBase, createWrapper } from '../test-utils';

describe('useAuth', () => {
  let mockPocketBase: PocketBase;

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

  describe('signIn', () => {
    describe('email', () => {
      it('should handle signIn with email (basic)', async () => {
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

        const wrapper = createWrapper(mockPocketBase);

        const { result } = renderHook(() => useAuth(), { wrapper });

        const options = { expand: 'profile' };

        await act(async () => {
          await result.current.signIn.email('test@example.com', 'password', options);
        });

        expect(mockAuth).toHaveBeenCalledWith('test@example.com', 'password', options);
      });
    });

    describe('social', () => {
      it('should handle signIn with social provider (basic)', async () => {
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

        const wrapper = createWrapper(mockPocketBase);

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

        const wrapper = createWrapper(mockPocketBase);

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

        const wrapper = createWrapper(mockPocketBase);

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
    });

    describe('otp', () => {
      it('should handle signIn with OTP (basic)', async () => {
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

        await act(async () => {
          await result.current.signIn.otp('123456', 'password');
        });

        expect(mockAuth).toHaveBeenCalledWith('123456', 'password', undefined);
      });

      it('should handle signIn with OTP (with options)', async () => {
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

        await act(async () => {
          await result.current.signIn.otp('123456', 'password', { expand: 'profile' });
        });

        expect(mockAuth).toHaveBeenCalledWith('123456', 'password', { expand: 'profile' });
      });
    });
  });

  it('should handle signOut', async () => {
    const mockClear = vi.fn();
    mockPocketBase.authStore = {
      ...mockPocketBase.authStore,
      clear: mockClear,
    } as unknown as typeof mockPocketBase.authStore;

    const wrapper = createWrapper(mockPocketBase);

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

    mockPocketBase.collection('users').create = mockCreate;

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signUp.email('new@example.com', 'password');
    });

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

    mockPocketBase.collection('users').create = mockCreate;

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useAuth(), { wrapper });

    const options = {
      additionalData: { name: 'John Doe' },
      expand: 'profile',
    };

    await act(async () => {
      await result.current.signUp.email('new@example.com', 'password', options);
    });

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
    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useAuth(), { wrapper });

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

    const wrapper = createWrapper(mockPocketBase);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn.email('test@example.com', 'password');
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.isAuthenticated).toBe(false);
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

    act(() => {
      listeners.forEach((listener) => {
        listener('mock-token', mockUser);
      });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should subscribe to user record updates when authenticated', async () => {
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

    renderHook(() => useAuth(), { wrapper });

    expect(mockSubscribe).toHaveBeenCalledWith('1', expect.any(Function));
  });

  it('should handle user record update via subscription', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const updatedUser = { id: '1', email: 'updated@example.com', name: 'Updated' };
    let subscriptionCallback: ((e: { action: string; record: unknown }) => void) | null = null;

    const mockPocketBaseWithUser = createMockAuthPocketBase({
      isValid: true,
      record: mockUser,
    });

    mockPocketBaseWithUser.collection = vi.fn().mockReturnValue({
      subscribe: vi.fn((id: string, callback: (e: { action: string; record: unknown }) => void) => {
        subscriptionCallback = callback;
        return Promise.resolve(() => {});
      }),
    });

    const wrapper = createWrapper(mockPocketBaseWithUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);

    act(() => {
      if (subscriptionCallback) {
        subscriptionCallback({ action: 'update', record: updatedUser });
      }
    });

    expect(result.current.user).toEqual(updatedUser);
  });

  it('should handle user record deletion via subscription', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    let subscriptionCallback: ((e: { action: string; record: unknown }) => void) | null = null;

    const mockPocketBaseWithUser = createMockAuthPocketBase({
      isValid: true,
      record: mockUser,
    });

    mockPocketBaseWithUser.collection = vi.fn().mockReturnValue({
      subscribe: vi.fn((id: string, callback: (e: { action: string; record: unknown }) => void) => {
        subscriptionCallback = callback;
        return Promise.resolve(() => {});
      }),
    });

    const wrapper = createWrapper(mockPocketBaseWithUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);

    act(() => {
      if (subscriptionCallback) {
        subscriptionCallback({ action: 'delete', record: mockUser });
      }
    });

    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  describe('passwordReset', () => {
    it('should request password reset', async () => {
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

      await act(async () => {
        await result.current.passwordReset.request('test@example.com');
      });

      expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com', undefined);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should request password reset with options', async () => {
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

      const options = { expand: 'profile' };
      await act(async () => {
        await result.current.passwordReset.request('test@example.com', options);
      });

      expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com', options);
    });

    it('should confirm password reset', async () => {
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

      await act(async () => {
        await result.current.passwordReset.confirm('token123', 'newpassword', 'newpassword');
      });

      expect(mockConfirmPasswordReset).toHaveBeenCalledWith('token123', 'newpassword', 'newpassword', undefined);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should confirm password reset with options', async () => {
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

      const options = { expand: 'profile' };
      await act(async () => {
        await result.current.passwordReset.confirm('token123', 'newpassword', 'newpassword', options);
      });

      expect(mockConfirmPasswordReset).toHaveBeenCalledWith('token123', 'newpassword', 'newpassword', options);
    });

    it('should handle password reset request error', async () => {
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

      await act(async () => {
        await result.current.passwordReset.request('test@example.com');
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle password reset confirm error', async () => {
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

      await act(async () => {
        await result.current.passwordReset.confirm('token123', 'newpassword', 'newpassword');
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('verification', () => {
    it('should request email verification', async () => {
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

      await act(async () => {
        await result.current.verification.request('test@example.com');
      });

      expect(mockRequestVerification).toHaveBeenCalledWith('test@example.com', undefined);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should request email verification with options', async () => {
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

      const options = { expand: 'profile' };
      await act(async () => {
        await result.current.verification.request('test@example.com', options);
      });

      expect(mockRequestVerification).toHaveBeenCalledWith('test@example.com', options);
    });

    it('should confirm email verification', async () => {
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

      await act(async () => {
        await result.current.verification.confirm('token123');
      });

      expect(mockConfirmVerification).toHaveBeenCalledWith('token123', undefined);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should confirm email verification with options', async () => {
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

      const options = { expand: 'profile' };
      await act(async () => {
        await result.current.verification.confirm('token123', options);
      });

      expect(mockConfirmVerification).toHaveBeenCalledWith('token123', options);
    });

    it('should handle verification request error', async () => {
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

      await act(async () => {
        await result.current.verification.request('test@example.com');
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle verification confirm error', async () => {
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

      await act(async () => {
        await result.current.verification.confirm('token123');
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
