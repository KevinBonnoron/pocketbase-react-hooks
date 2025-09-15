import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type Pocketbase from 'pocketbase';
import { describe, expect, it, vi } from 'vitest';
import { PocketbaseContext, usePocketbaseContext } from '../src/context/PocketbaseContext';
import { PocketbaseProvider } from '../src/providers/PocketbaseProvider';

// Mock Pocketbase
const mockPocketbase = {
  baseURL: 'http://localhost:8090',
  authStore: {
    isValid: false,
    model: null,
    onChange: vi.fn(() => () => {}),
  },
} as unknown as Pocketbase;

// Test component that uses the context
function TestComponent() {
  const pb = usePocketbaseContext();
  return <div data-testid="pocketbase-url">{pb.baseURL}</div>;
}

describe('PocketbaseContext', () => {
  it('should create context with null default value', () => {
    expect(PocketbaseContext).toBeDefined();
    expect(PocketbaseContext.Provider).toBeDefined();
    expect(PocketbaseContext.Consumer).toBeDefined();
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      render(<TestComponent />);
    }).toThrow('usePocketbaseContext must be used within a PocketbaseProvider');
  });
});

describe('PocketbaseProvider', () => {
  it('should render children with Pocketbase context', () => {
    render(
      <PocketbaseProvider pocketBase={mockPocketbase}>
        <TestComponent />
      </PocketbaseProvider>,
    );

    expect(screen.getByTestId('pocketbase-url')).toHaveTextContent('http://localhost:8090');
  });

  it('should pass the correct Pocketbase instance', () => {
    const customPb = {
      baseURL: 'http://custom:8090',
      authStore: {
        isValid: true,
        model: { id: '1', email: 'test@example.com' },
        onChange: vi.fn(() => () => {}),
      },
    } as unknown as Pocketbase;

    render(
      <PocketbaseProvider pocketBase={customPb}>
        <TestComponent />
      </PocketbaseProvider>,
    );

    expect(screen.getByTestId('pocketbase-url')).toHaveTextContent('http://custom:8090');
  });
});
