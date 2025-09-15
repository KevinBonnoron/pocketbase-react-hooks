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
        <button onClick={() => signIn.email('email', 'password')}>
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
- `signIn`: Object containing authentication methods
  - `signIn.email(email, password, options?)`: Sign in with email and password
  - `signIn.social(provider, options?)`: Sign in with OAuth2 provider
- `signUp`: Object containing registration methods
  - `signUp.email(email, password, options?)`: Create new user account
- `signOut()`: Sign out current user

**Example:**
```tsx
import { useAuth } from 'pocketbase-react-hooks';

function AuthComponent() {
  const { user, isAuthenticated, signIn, signUp, signOut, isLoading, error } = useAuth();

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
        <div>
          <button onClick={() => signIn.email('user@example.com', 'password')}>
            Sign In with Email
          </button>
          <button onClick={() => signIn.social('google')}>
            Sign In with Google
          </button>
          <button onClick={() => signIn.social('github', { 
            scopes: ['user:email', 'read:user'] 
          })}>
            Sign In with GitHub
          </button>
          <button onClick={() => signUp.email('user@example.com', 'password')}>
            Sign Up
          </button>
        </div>
      )}
    </div>
  );
}
```

#### Email Authentication Options

The `signIn.email()` and `signUp.email()` methods accept optional configuration objects:

**signIn.email options:**
```typescript
interface RecordOptions {
  expand?: string;  // Fields to expand (e.g., 'profile,settings')
}
```

**signUp.email options:**
```typescript
interface SignUpOptions extends RecordOptions {
  additionalData?: Record<string, unknown>; // Additional user data
}
```

**Examples:**

```tsx
// Basic email authentication
await signIn.email('user@example.com', 'password');

// With expand options
await signIn.email('user@example.com', 'password', { 
  expand: 'profile,settings' 
});

// Basic sign up
await signUp.email('user@example.com', 'password');

// With additional data and expand
await signUp.email('user@example.com', 'password', {
  additionalData: {
    name: 'John Doe',
    role: 'user',
    preferences: { theme: 'dark' }
  },
  expand: 'profile'
});
```

#### OAuth2 Configuration Options

The `signIn.social()` method accepts a provider string and an optional `OAuth2AuthConfig` object (without the provider field):

```typescript
interface OAuth2AuthConfig {
  scopes?: Array<string>;              // Optional: Custom scopes to request
  createData?: { [key: string]: any }; // Optional: Additional data when creating new user
  urlCallback?: (url: string) => void; // Optional: Callback after OAuth2 URL generation
}
```

**Examples:**

```tsx
// Basic OAuth2 authentication
await signIn.social('google');

// With custom scopes
await signIn.social('github', { 
  scopes: ['user:email', 'read:user', 'repo'] 
});

// With additional user data
await signIn.social('discord', {
  createData: {
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg'
  }
});

// With URL callback for custom handling
await signIn.social('google', {
  urlCallback: (url) => {
    // Custom logic before redirecting to OAuth2 provider
    console.log('Redirecting to:', url);
    window.location.href = url;
  }
});
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
### `useRecord<Record>(collectionName, filter, options?)`
Fetches and manages a single record with real-time updates. Can fetch by ID or by filter.

**Parameters:**
- `collectionName`: Name of the PocketBase collection
- `recordId`: ID of the record to fetch (can be null/undefined)
- `filter`: Filter string to find a single record (e.g., `'slug="my-post"'`)
- `options`: Optional configuration object
  - `expand`: Fields to expand
  - `fields`: Fields to return
  - `defaultValue`: Default value while loading

**Returns:**
- `data`: Record object or null
- `isLoading`: Boolean indicating if data is being fetched
- `isError`: Boolean indicating if an error occurred
- `error`: Error message if fetch failed

**Examples:**

Fetch by ID:
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
    </article>
  );
}
```

Fetch by filter:
```tsx
import { useRecord } from 'pocketbase-react-hooks';

function PostBySlug({ slug }: { slug: string }) {
  const { data: post, isLoading, isError, error } = useRecord('posts', `slug="${slug}" && status="published"`, {
    expand: 'author'
  });

  if (isLoading) return <div>Loading post...</div>;
  if (isError) return <div>Error: {error}</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {post.expand.author?.name}</p>
      <div>{post.content}</div>
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
const { data: post } = useRecord<Post>('posts', postId); // by ID
const { data: postBySlug } = useRecord<Post>('posts', 'slug="my-post"'); // by filter
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
