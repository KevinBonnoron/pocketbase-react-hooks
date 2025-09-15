import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type PocketBase from 'pocketbase';
import { describe, expect, it } from 'vitest';
import { PocketBaseContext, usePocketBaseContext } from '../src/context/PocketBaseContext';
import { PocketBaseProvider } from '../src/providers/PocketBaseProvider';
import { createMockPocketBase } from './test-utils';

const mockPocketBase = createMockPocketBase();

function TestComponent() {
  const pb = usePocketBaseContext();
  return <div data-testid="pocketbase-url">{pb.baseURL}</div>;
}

describe('PocketBaseContext', () => {
  it('should create context with null default value', () => {
    expect(PocketBaseContext).toBeDefined();
    expect(PocketBaseContext.Provider).toBeDefined();
    expect(PocketBaseContext.Consumer).toBeDefined();
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      render(<TestComponent />);
    }).toThrow('usePocketBaseContext must be used within a PocketBaseProvider');
  });
});

describe('PocketBaseProvider', () => {
  it('should render children with PocketBase context', () => {
    render(
      <PocketBaseProvider pocketBase={mockPocketBase}>
        <TestComponent />
      </PocketBaseProvider>,
    );

    expect(screen.getByTestId('pocketbase-url')).toHaveTextContent('http://localhost:8090');
  });

  it('should pass the correct PocketBase instance', () => {
    const customPb = createMockPocketBase({
      authStore: {
        isValid: true,
        record: { id: '1', email: 'test@example.com' },
      },
    });
    (customPb as any).baseURL = 'http://custom:8090';

    render(
      <PocketBaseProvider pocketBase={customPb}>
        <TestComponent />
      </PocketBaseProvider>,
    );

    expect(screen.getByTestId('pocketbase-url')).toHaveTextContent('http://custom:8090');
  });
});
