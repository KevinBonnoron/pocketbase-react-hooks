import '@testing-library/jest-dom';

// Ensure jsdom environment is properly set up
if (typeof globalThis.document === 'undefined') {
  throw new Error('jsdom environment is not properly configured');
}
