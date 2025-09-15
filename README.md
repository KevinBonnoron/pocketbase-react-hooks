# Pocketbase React Hooks

A collection of React hooks for easy Pocketbase integration in your React applications.

## Installation

```bash
npm install pocketbase-react-hooks
# or
yarn add pocketbase-react-hooks
# or
bun add pocketbase-react-hooks
```

## Quick Start

### 1. Setup the Provider

```tsx
import React from 'react'
import Pocketbase from 'pocketbase'
import { PocketbaseProvider } from 'pocketbase-react-hooks'

const pb = new Pocketbase('http://127.0.0.1:8090')

function App() {
  return (
    <PocketbaseProvider pocketBase={pb}>
      <YourApp />
    </PocketbaseProvider>
  )
}
```

### 2. Use the hooks

```tsx
import { useAuth, useCollection, useMutation } from 'pocketbase-react-hooks'

function MyComponent() {
  // Authentication
  const { user, isAuthenticated, signIn, signOut } = useAuth()
  
  // Collection
  const { items, isLoading, refresh } = useCollection({
    collection: 'posts',
    perPage: 10
  })
  
  // Mutations
  const { mutate: createPost, isLoading: isCreating } = useMutation({
    collection: 'posts'
  })
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Hello {user?.email}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => signIn('email', 'password')}>
          Sign In
        </button>
      )}
      
      <div>
        <h2>Posts</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {items.map(post => (
              <li key={post.id}>{post.title}</li>
            ))}
          </ul>
        )}
        <button onClick={refresh}>Refresh</button>
      </div>
    </div>
  )
}
```

## Available Hooks

### `useAuth()`
Manages user authentication.

### `useCollection(options)`
Fetches and manages a collection of data.

### `useMutation(options)`
Handles CRUD operations (Create, Update, Delete).

### `usePocketbase()`
Access the Pocketbase instance directly.

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Development with watch
bun run dev

# Run tests
bun test

# Run tests in watch mode
bun run test:watch

# Type checking
bun run type-check

# Linting
bun run lint

# Format code
bun run format
```

## License

MIT
