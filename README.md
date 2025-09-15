# PocketBase React Hooks

A collection of React hooks for easy PocketBase integration in your React applications.

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
import React from 'react';
import PocketBase from 'pocketbase';
import { PocketBaseProvider } from 'pocketbase-react-hooks';

const pb = new PocketBase('http://127.0.0.1:8090');

function App() {
  return (
    <PocketBaseProvider pocketBase={pb}>
      <YourApp />
    </PocketBaseProvider>
  );
}
```

### 2. Use the hooks

```tsx
import { useAuth, useCollection } from 'pocketbase-react-hooks';

function MyComponent() {
  // Authentication
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  
  // Collection
  const { data: posts, isLoading, isError, error } = useCollection('posts');
  
  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Error: {error}</div>;
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Hello {user.email}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => signIn('email', 'password')}>
          Sign In
        </button>
      )}
      
      <div>
        <h2>Posts</h2>
        <ul>
          {posts.map(post => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## Available Hooks

### `useAuth<User>()`
Manages user authentication with real-time updates.

**Returns:**
- `user`: Current authenticated user or null
- `isAuthenticated`: Boolean indicating if user is logged in
- `isLoading`: Boolean indicating if an auth operation is in progress
- `error`: Error object if authentication failed
- `signIn(email, password)`: Sign in with email and password
- `signUp(email, password, passwordConfirm, data?)`: Create new user account
- `signOut()`: Sign out current user
- `refresh()`: Refresh authentication token
- `update(data)`: Update current user data

**Example:**
```tsx
import { useAuth } from 'pocketbase-react-hooks';

function AuthComponent() {
  const { user, isAuthenticated, signIn, signOut, isLoading, error } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => signIn('user@example.com', 'password')}>
          Sign In
        </button>
      )}
    </div>
  );
}
```

### `useCollection<Record>(collectionName, options?)`
Fetches and manages a collection of data with real-time subscriptions.

**Parameters:**
- `collectionName`: Name of the PocketBase collection
- `options`: Optional configuration object
  - `filter`: Filter string (e.g., `'status = "published"'`)
  - `sort`: Sort string (e.g., `'-created'`)
  - `expand`: Fields to expand (e.g., `'author,comments'`)
  - `fields`: Fields to return (e.g., `'id,title,content'`)
  - `page`: Page number for pagination
  - `perPage`: Number of items per page
  - `defaultValue`: Default value while loading

**Returns:**
- `data`: Array of records or null
- `isLoading`: Boolean indicating if data is being fetched
- `isError`: Boolean indicating if an error occurred
- `error`: Error message if fetch failed

**Example:**
```tsx
import { useCollection } from 'pocketbase-react-hooks';

function PostsList() {
  const { data: posts, isLoading, isError, error } = useCollection('posts', {
    filter: 'status = "published"',
    sort: '-created',
    expand: 'author',
    perPage: 20
  });

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Error: {error}</div>;

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h3>{post.title}</h3>
          <p>By {post.expand?.author?.name}</p>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}
```

### `useRecord<Record>(collectionName, recordId, options?)`
Fetches and manages a single record with real-time updates.

**Parameters:**
- `collectionName`: Name of the PocketBase collection
- `recordId`: ID of the record to fetch (can be null/undefined)
- `options`: Optional configuration object
  - `expand`: Fields to expand
  - `fields`: Fields to return
  - `defaultValue`: Default value while loading

**Returns:**
- `data`: Record object or null
- `isLoading`: Boolean indicating if data is being fetched
- `isError`: Boolean indicating if an error occurred
- `error`: Error message if fetch failed

**Example:**
```tsx
import { useRecord } from 'pocketbase-react-hooks';

function PostDetail({ postId }: { postId: string }) {
  const { data: post, isLoading, isError, error } = useRecord('posts', postId, {
    expand: 'author,comments'
  });

  if (isLoading) return <div>Loading post...</div>;
  if (isError) return <div>Error: {error}</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {post.expand.author?.name}</p>
      <div>{post.content}</div>
      {post.expand.comments && (
        <div>
          <h3>Comments</h3>
          {post.expand.comments.map(comment => (
            <div key={comment.id}>
              <p>{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
```

### `useMutation<Record>(collectionName)`
Handles CRUD operations (Create, Update, Delete).

**Parameters:**
- `collectionName`: Name of the PocketBase collection

**Returns:**
- `create(data)`: Create a new record
- `update(id, data)`: Update an existing record
- `remove(id)`: Delete a record
- `isPending`: Boolean indicating if a mutation is in progress
- `isError`: Boolean indicating if an error occurred
- `isSuccess`: Boolean indicating if the last mutation was successful
- `error`: Error message if mutation failed

**Example:**
```tsx
import { useMutation } from 'pocketbase-react-hooks';

function CreatePost() {
  const { create, isPending, isError, error } = useMutation('posts');

  const handleCreate = async () => {
    try {
      const newPost = await create({
        title: 'New Post',
        content: 'This is a new post',
        status: 'draft'
      });
      console.log('Post created:', newPost);
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  if (isError) return <div>Error: {error}</div>;

  return (
    <button onClick={handleCreate} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create Post'}
    </button>
  );
}
```

### `usePocketBase()`
Access the PocketBase instance directly from context.

**Example:**
```tsx
import { usePocketBase } from 'pocketbase-react-hooks';

function CustomComponent() {
  const pb = usePocketBase();

  const handleCustomOperation = async () => {
    // Use PocketBase directly for custom operations
    const result = await pb.collection('custom').getList(1, 10);
    return result;
  };

  return <button onClick={handleCustomOperation}>Custom Operation</button>;
}
```

## TypeScript Support

The library is fully typed with TypeScript. You can provide custom types for your records:

```tsx
interface User extends RecordModel {
  email: string;
  name: string;
  avatar?: string;
}

interface Post extends RecordModel {
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  author: string; // relation to users
  tags: string[];
  published_at?: string;
}

// Use with custom types
const { user } = useAuth<User>();
const { data: posts } = useCollection<Post>('posts');
const { data: post } = useRecord<Post>('posts', postId);
const { create } = useMutation<Post>('posts');
```

## Real-time Features

All hooks support real-time updates through PocketBase subscriptions:

- `useCollection` automatically updates when records are created, updated, or deleted
- `useRecord` automatically updates when the specific record changes
- `useAuth` automatically updates when authentication state changes

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
