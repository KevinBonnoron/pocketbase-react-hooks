import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import type Pocketbase from 'pocketbase';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { usePocketbase } from '../../src/hooks/usePocketbase';
import { PocketbaseProvider } from '../../src/providers/PocketbaseProvider';

// Mock Pocketbase
const mockPocketbase = {
  baseURL: 'http://localhost:8090',
  authStore: {
    isValid: false,
    model: null,
    onChange: vi.fn(() => () => {}),
  },
} as unknown as Pocketbase;

describe('usePocketbase', () => {
  it('should return Pocketbase instance from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <PocketbaseProvider pocketBase={mockPocketbase}>{children}</PocketbaseProvider>;

    const { result } = renderHook(() => usePocketbase(), { wrapper });

    expect(result.current).toBe(mockPocketbase);
    expect(result.current.baseURL).toBe('http://localhost:8090');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => usePocketbase());
    }).toThrow('usePocketbase must be used within a PocketbaseProvider');
  });
});
