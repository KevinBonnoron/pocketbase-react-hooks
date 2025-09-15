import type PocketBase from 'pocketbase';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { PocketBaseProvider } from '../src/providers/PocketBaseProvider';

interface MockCollectionMethods {
  getFullList?: ReturnType<typeof vi.fn>;
  getList?: ReturnType<typeof vi.fn>;
  getOne?: ReturnType<typeof vi.fn>;
  getFirstListItem?: ReturnType<typeof vi.fn>;
  subscribe?: ReturnType<typeof vi.fn>;
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  delete?: ReturnType<typeof vi.fn>;
  authWithPassword?: ReturnType<typeof vi.fn>;
  authWithOAuth2?: ReturnType<typeof vi.fn>;
  authWithOTP?: ReturnType<typeof vi.fn>;
  requestPasswordReset?: ReturnType<typeof vi.fn>;
  confirmPasswordReset?: ReturnType<typeof vi.fn>;
  requestVerification?: ReturnType<typeof vi.fn>;
  confirmVerification?: ReturnType<typeof vi.fn>;
  requestOTP?: ReturnType<typeof vi.fn>;
}

interface MockAuthStore {
  isValid: boolean;
  record: unknown;
  onChange: ReturnType<typeof vi.fn>;
  clear?: ReturnType<typeof vi.fn>;
}

interface CreateMockPocketBaseOptions {
  authStore?: Partial<MockAuthStore>;
  collectionMethods?: MockCollectionMethods;
}

export function createMockPocketBase(options: CreateMockPocketBaseOptions = {}): PocketBase {
  const { authStore = {}, collectionMethods = {} } = options;

  const defaultAuthStore: MockAuthStore = {
    isValid: false,
    record: null,
    onChange: vi.fn(() => () => {}),
    clear: vi.fn(),
    ...authStore,
  };

  const defaultCollectionMethods: MockCollectionMethods = {
    getFullList: vi.fn(),
    getList: vi.fn(),
    getOne: vi.fn(),
    getFirstListItem: vi.fn(),
    subscribe: vi.fn().mockResolvedValue(() => {}),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    authWithPassword: vi.fn(),
    authWithOAuth2: vi.fn(),
    authWithOTP: vi.fn(),
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
    requestVerification: vi.fn(),
    confirmVerification: vi.fn(),
    requestOTP: vi.fn(),
    ...collectionMethods,
  };

  return {
    baseURL: 'http://localhost:8090',
    autoCancellation: vi.fn().mockReturnThis(),
    collection: vi.fn().mockReturnValue(defaultCollectionMethods),
    authStore: defaultAuthStore,
  } as unknown as PocketBase;
}

export function createMockAuthPocketBase(initialAuth: { isValid: boolean; record: unknown } = { isValid: false, record: null }): PocketBase {
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
      authWithOTP: vi.fn(),
      create: vi.fn(),
      authRefresh: vi.fn(),
      subscribe: vi.fn(() => Promise.resolve(() => {})),
      requestPasswordReset: vi.fn(),
      confirmPasswordReset: vi.fn(),
      requestVerification: vi.fn(),
      confirmVerification: vi.fn(),
      requestOTP: vi.fn(),
    }),
  } as unknown as PocketBase;
}

export function createWrapper(pocketBase: PocketBase) {
  return ({ children }: { children: ReactNode }) => <PocketBaseProvider pocketBase={pocketBase}>{children}</PocketBaseProvider>;
}

export function getMockCollectionMethods(mockPocketBase: PocketBase, collectionName = 'test'): MockCollectionMethods {
  return mockPocketBase.collection(collectionName) as unknown as MockCollectionMethods;
}
