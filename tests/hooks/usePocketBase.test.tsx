import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePocketBase } from '../../src/hooks/usePocketBase';
import { createMockPocketBase, createWrapper } from '../test-utils';

const mockPocketBase = createMockPocketBase();

describe('usePocketBase', () => {
  it('should return PocketBase instance from context', () => {
    const wrapper = createWrapper(mockPocketBase);

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
