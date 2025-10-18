# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PocketBase React Hooks is a React hooks library providing custom hooks for PocketBase integration, including authentication, data fetching, real-time subscriptions, and mutations. Built as a dual-package (ESM + CJS) TypeScript library using Vite.

## Development Commands

### Core Development
- `bun run build` - Build the library (outputs ESM and CJS to `dist/`)
- `bun run dev` - Build in watch mode for development
- `bun run type-check` - Run TypeScript type checking without emitting files

### Testing
- `bun run test` - Run all tests once
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Run tests with coverage report

### Code Quality
- `bun run lint` - Lint code with Biome
- `bun run format` - Format code with Biome

### Versioning & Publishing
- `bun run version:patch/minor/major` - Bump version for stable releases
- `bun run version:alpha/beta/rc` - Bump version for pre-releases
- `bun run release` - Build and publish stable release
- `bun run prerelease` - Build and publish pre-release with beta tag

## Architecture

### Core Patterns

**Context + Provider Pattern**: The library uses React Context (`PocketBaseContext`) to inject the PocketBase client instance throughout the component tree via `PocketBaseProvider`.

**Query Result Type**: All data-fetching hooks return a discriminated union type `QueryResult<T>` with three states:
- Loading: `{ isLoading: true, isSuccess: false, isError: false, error: null, data: null }`
- Success: `{ isLoading: false, isSuccess: true, isError: false, error: null, data: T }`
- Error: `{ isLoading: false, isSuccess: false, isError: true, error: string, data: null }`

This pattern follows TanStack Query conventions with `isLoading`, `isSuccess`, `isError` states.

**Real-time Subscriptions**: Hooks automatically set up PocketBase real-time subscriptions using `pb.collection().subscribe()`. Each hook manages its own subscription lifecycle in a `useEffect` with proper cleanup via `unsubscribe()`.

**Request Cancellation**: The `requestKey` parameter is passed directly to PocketBase SDK and can be used with `pb.cancelRequest(key)` to abort pending requests. Useful for handling search queries, preventing race conditions, or cleaning up on unmount.

**Data Transformers**: Both `useCollection` and `useRecord` support a `transformers` option that accepts an array of `RecordTransformer<T>` functions. Transformers are applied sequentially (via `reduce()`) to transform records before they're returned to components. By default, both hooks automatically apply `dateTransformer()` which converts `created` and `updated` fields from ISO strings to `Date` objects. Transformers are applied to:
- Initial fetch results
- Real-time subscription events (create, update)

Error handling: If a transformer throws, `applyTransformers()` catches the error, logs to console, and returns the original record. Transformers use `useRef` to maintain stable references and avoid re-creating subscriptions.

### Hook Architecture

**useCollection**: Fetches collection data with `getFullList()` or `getList()` based on `fetchAll` option. Handles real-time updates by applying create/update/delete actions to the current data array and re-sorting if needed. Applies transformers to all records (both initial fetch and real-time updates).

**useRecord**: Fetches a single record by ID using `getOne()` or by filter using `getFirstListItem()`. Subscribes to that specific record's changes. Applies transformers to the record (both initial fetch and real-time updates).

**useAuth**: Manages authentication state by listening to `pb.authStore.onChange()`. Provides `signIn.email()`, `signIn.social()`, `signUp.email()`, and `signOut()` methods. Returns the authenticated user via `pb.authStore.model`.

**useCreateMutation**: Creates new records in a collection. Takes `collectionName` and returns a `mutate()` function that accepts `bodyParams` and optional `RecordOptions`. Tracks mutation state with `isPending`, `isSuccess`, `isError`, `error`.

**useUpdateMutation**: Updates existing records in a collection. Takes `collectionName` and returns a `mutate()` function that accepts `id`, `bodyParams`, and optional `RecordOptions`. Tracks mutation state with `isPending`, `isSuccess`, `isError`, `error`.

**useDeleteMutation**: Deletes records from a collection. Takes `collectionName` and returns a `mutate()` function that accepts `id` and optional `CommonOptions`. Tracks mutation state with `isPending`, `isSuccess`, `isError`, `error`.

**usePocketBase**: Simple hook that returns the PocketBase instance from context via `usePocketBaseContext()`.

### File Structure

- `src/context/PocketBaseContext.tsx` - React Context definition and `usePocketBaseContext()` hook
- `src/providers/PocketBaseProvider.tsx` - Provider component that wraps the app
- `src/hooks/` - All custom hooks (`useAuth`, `useCollection`, `useRecord`, `useCreateMutation`, `useUpdateMutation`, `useDeleteMutation`, `usePocketBase`)
- `src/lib/utils.ts` - Shared utilities (`sortRecords`, `applyTransformers`)
- `src/transformers/` - Built-in transformers (`dateTransformer`)
- `src/types/index.ts` - TypeScript type definitions for hook options and results
- `tests/hooks/` - Test files mirroring the hooks structure

### Build Configuration

**Vite**: Configured to build a library with dual output (ESM + CJS). Uses `vite-plugin-dts` to generate TypeScript declaration files with `rollupTypes: true` for bundled declarations.

**External Dependencies**: React, React DOM, and PocketBase are marked as external and peer dependencies - they are not bundled with the library.

**Test Configuration**: Vitest is configured with jsdom environment, v8 coverage provider, and console.error suppression for cleaner test output.

## Code Conventions

### API Design
- Use TanStack Query naming conventions:
  - Query hooks (`useCollection`, `useRecord`): `isLoading`, `isSuccess`, `isError`, `data`, `error`
  - Mutation hooks (`useCreateMutation`, `useUpdateMutation`, `useDeleteMutation`): `isPending`, `isSuccess`, `isError`, `error`
- Use `signIn`/`signOut` (not `login`/`logout`), `signUp` (not `register`)
- Query hooks return discriminated union types for type-safe state handling
- Mutation hooks return object with `mutate` function and state flags

### TypeScript
- Strict mode enabled - no `any` types, use `unknown` when type is uncertain
- Generic type parameters for records: `useCollection<Post>()`, `useAuth<User>()`
- All exports must have explicit types defined in `src/types/index.ts`

### React Patterns
- Use `useEffect` for data fetching and subscriptions
- Always return cleanup functions from `useEffect` for subscriptions
- Use `useCallback` to memoize fetcher functions passed to `useEffect`
- Avoid inline object creation in dependency arrays
- **StrictMode Cancellation Pattern**: Use `useRef` for defaultValue to stabilize references, and implement a `cancelled` flag in fetch effects to prevent state updates from stale requests:
  ```typescript
  const defaultValueRef = useRef(defaultValue);
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const result = await fetch();
      if (!cancelled) {
        setData(result);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [dependencies]);
  ```
- **Subscription State Updates**: Use functional setState form `setData((current) => ...)` in subscriptions to avoid adding `data` to dependencies, which would cause unnecessary subscription recreation

### Testing
- Mock PocketBase client methods using Vitest's `vi.fn()`
- Test all three states: loading, success, error
- Verify subscription setup and cleanup
- Use `renderHook` from `@testing-library/react` to test hooks
- Wrap hooks in `PocketBaseProvider` with mocked client
- Use `waitFor` from `@testing-library/react` for assertions only (not `act` + `setTimeout`):
  - Do NOT pass an async callback.
  - Perform actions (user events/hook calls) before waitFor.
  - Always return or await the waitFor promise.
  ```typescript
  // ✅ Correct
  await result.current.mutate('1');
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  // ❌ Incorrect
  await waitFor(async () => {
    await result.current.mutate('1');
    expect(result.current.isSuccess).toBe(true);
  });
```
### Code Style
- **NEVER add comments** to code (enforced by .cursorrules)
- Use Biome for formatting and linting
- Keep code clean and minimal
- lefthook runs format, lint, and type-check on pre-commit; tests on pre-push

## Important Notes

- **Peer Dependencies**: React >=19.0.0 and PocketBase ^0.26.2 must be installed by consumers
- **Real-time Subscriptions**: Enabled by default but can be disabled with `realtime: false` option
- **Conditional Fetching**: Use `enabled: false` to disable data fetching (similar to TanStack Query)
- **Error Handling**: All hooks expose `isError` and `error` for graceful error states
- **Request Cancellation**: Use `requestKey` option in `useCollection` and `useRecord` to enable request cancellation via `pb.cancelRequest(key)`
- **Data Transformers**: By default, `useCollection` and `useRecord` apply `dateTransformer()` to convert `created` and `updated` fields to `Date` objects. Users can provide custom transformers via the `transformers` option or disable all transformations with `transformers: []`. Transformers are stored in `useRef` to maintain stable references and prevent re-renders.
- **React StrictMode**: The library handles React StrictMode's double-mounting correctly with cancellation flags to prevent auto-cancelled requests from updating state. If you encounter infinite loops or auto-cancellation issues, ensure dependencies are stable (use `useRef` for objects/arrays passed as options)
