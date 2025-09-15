import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { usePocketBase } from '../../src/hooks/usePocketBase';
import { PocketBaseProvider } from '../../src/providers/PocketbaseProvider';

// Mock PocketBase
const mockPocketBase = {
  baseURL: 'http://localhost:8090',
  authStore: {
    isValid: false,
    model: null,
    onChange: vi.fn(() => () => {}),
  },
} as unknown as PocketBase;

describe('usePocketBase', () => {
  it('should return PocketBase instance from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketBaseProvider pocketBase={mockPocketBase}>{children}</PocketBaseProvider>;

    const { result } = renderHook(() => usePocketBase(), { wrapper });

    expect(result.current).toBe(mockPocketBase);
    expect(result.current.baseURL).toBe('http://localhost:8090');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => usePocketBase());
    }).toThrow('usePocketBase must be used within a PocketBaseProvider');
  });
});
