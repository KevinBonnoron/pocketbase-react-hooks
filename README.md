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
- `passwordReset`: Object containing password reset methods
  - `passwordReset.request(email, options?)`: Request password reset email
  - `passwordReset.confirm(token, password, passwordConfirm, options?)`: Confirm password reset
- `verification`: Object containing email verification methods
  - `verification.request(email, options?)`: Request verification email
  - `verification.confirm(token, options?)`: Confirm email verification

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
  - `enabled`: Boolean to enable/disable data fetching (default: `true`)
  - `fetchAll`: Boolean to use `getFullList` (true) or `getList` (false) (default: `true`)
  - `subscribe`: Boolean to enable/disable real-time subscriptions (default: `true`)
  - `requestKey`: Optional key passed to PocketBase for request cancellation (optional)
  - `transformers`: Array of transformer functions to apply to records (default: `[dateTransformer()]`)

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

**Conditional Data Fetching:**
```tsx
import { useCollection } from 'pocketbase-react-hooks';

function ConditionalPostsList({ shouldFetch }: { shouldFetch: boolean }) {
  const { data: posts, isLoading, isError, error } = useCollection('posts', {
    filter: 'status = "published"',
    enabled: shouldFetch // Only fetch when shouldFetch is true
  });

  if (!shouldFetch) return <div>Data fetching is disabled</div>;
  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Error: {error}</div>;

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}
```

**Pagination with getList:**
```tsx
import { useCollection } from 'pocketbase-react-hooks';

function PaginatedPostsList({ currentPage }: { currentPage: number }) {
  const { data: posts, isLoading, isError, error } = useCollection('posts', {
    fetchAll: false, // Use getList instead of getFullList
    page: currentPage,
    perPage: 10,
    filter: 'status = "published"',
    sort: '-created'
  });

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Error: {error}</div>;

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}
```

**Without Real-time Subscriptions:**
```tsx
import { useCollection } from 'pocketbase-react-hooks';

function StaticPostsList() {
  const { data: posts, isLoading, isError, error } = useCollection('posts', {
    filter: 'status = "published"',
    subscribe: false // Disable real-time updates
  });

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Error: {error}</div>;

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}
```

**Combined Options:**
```tsx
import { useCollection } from 'pocketbase-react-hooks';

function AdvancedPostsList({ 
  currentPage, 
  shouldFetch, 
  enableRealtime 
}: { 
  currentPage: number;
  shouldFetch: boolean;
  enableRealtime: boolean;
}) {
  const { data: posts, isLoading, isError, error } = useCollection('posts', {
    fetchAll: false, // Use pagination
    page: currentPage,
    perPage: 20,
    filter: 'status = "published"',
    sort: '-created',
    expand: 'author',
    fields: 'id,title,content,author',
    enabled: shouldFetch,
    subscribe: enableRealtime
  });

  if (!shouldFetch) return <div>Data fetching is disabled</div>;
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
  - `requestKey`: Optional key passed to PocketBase for request cancellation (optional)
  - `transformers`: Array of transformer functions to apply to the record (default: `[dateTransformer()]`)

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

### `useCreateMutation<Record>(collectionName)`
Handles record creation operations.

**Parameters:**
- `collectionName`: Name of the PocketBase collection

**Returns:**
- `mutate(data, options?)`: Create a new record
- `isPending`: Boolean indicating if a mutation is in progress
- `isSuccess`: Boolean indicating if the last mutation was successful
- `error`: Error message if mutation failed

**Example:**
```tsx
import { useCreateMutation } from 'pocketbase-react-hooks';

function CreatePost() {
  const { mutate, isPending, isSuccess, error } = useCreateMutation('posts');

  const handleCreate = async () => {
    try {
      const newPost = await mutate({
        title: 'New Post',
        content: 'This is a new post',
        status: 'draft'
      });
      console.log('Post created:', newPost);
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <button onClick={handleCreate} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create Post'}
    </button>
  );
}
```

### `useUpdateMutation<Record>(collectionName)`
Handles record update operations.

**Parameters:**
- `collectionName`: Name of the PocketBase collection

**Returns:**
- `mutate(id, data, options?)`: Update an existing record
- `isPending`: Boolean indicating if a mutation is in progress
- `isSuccess`: Boolean indicating if the last mutation was successful
- `error`: Error message if mutation failed

**Example:**
```tsx
import { useUpdateMutation } from 'pocketbase-react-hooks';

function EditPost({ postId }: { postId: string }) {
  const { mutate, isPending, isSuccess, error } = useUpdateMutation('posts');

  const handleUpdate = async () => {
    try {
      const updatedPost = await mutate(postId, {
        title: 'Updated Post',
        content: 'This post has been updated',
        status: 'published'
      });
      console.log('Post updated:', updatedPost);
    } catch (err) {
      console.error('Failed to update post:', err);
    }
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <button onClick={handleUpdate} disabled={isPending}>
      {isPending ? 'Updating...' : 'Update Post'}
    </button>
  );
}
```

### `useDeleteMutation(collectionName)`
Handles record deletion operations.

**Parameters:**
- `collectionName`: Name of the PocketBase collection

**Returns:**
- `mutate(id, options?)`: Delete a record
- `isPending`: Boolean indicating if a mutation is in progress
- `isSuccess`: Boolean indicating if the last mutation was successful
- `error`: Error message if mutation failed

**Example:**
```tsx
import { useDeleteMutation } from 'pocketbase-react-hooks';

function DeletePost({ postId }: { postId: string }) {
  const { mutate, isPending, isSuccess, error } = useDeleteMutation('posts');

  const handleDelete = async () => {
    try {
      const success = await mutate(postId);
      if (success) {
        console.log('Post deleted successfully');
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? 'Deleting...' : 'Delete Post'}
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
  publishedAt?: Date;
}

// Use with custom types
const { user } = useAuth<User>();
const { data: posts } = useCollection<Post>('posts');
const { data: post } = useRecord<Post>('posts', postId); // by ID
const { data: postBySlug } = useRecord<Post>('posts', 'slug="my-post"'); // by filter
const { mutate: createPost } = useCreateMutation<Post>('posts');
const { mutate: updatePost } = useUpdateMutation<Post>('posts');
const { mutate: deletePost } = useDeleteMutation('posts');
```

## Data Transformers

The library includes a powerful data transformation system that allows you to automatically transform data received from PocketBase before it reaches your components.

### Default Date Transformation

By default, both `useCollection` and `useRecord` automatically apply a `dateTransformer` that converts ISO date strings to JavaScript `Date` objects for the `created` and `updated` fields.

```tsx
import { useCollection } from 'pocketbase-react-hooks';

interface Post extends RecordModel {
  title: string;
  content: string;
  created: Date;  // Automatically transformed from string to Date
  updated: Date;  // Automatically transformed from string to Date
}

function PostsList() {
  const { data: posts } = useCollection<Post>('posts');

  return (
    <div>
      {posts?.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>Created: {post.created.toLocaleDateString()}</p>
          <p>Updated: {post.updated.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Custom Date Fields

You can configure the `dateTransformer` to transform additional date fields:

```tsx
import { useCollection, dateTransformer } from 'pocketbase-react-hooks';

interface Post extends RecordModel {
  title: string;
  publishedAt: Date;
  created: Date;
  updated: Date;
}

function PostsList() {
  const { data: posts } = useCollection<Post>('posts', {
    transformers: [
      dateTransformer(['created', 'updated', 'publishedAt'])
    ]
  });

  return (
    <div>
      {posts?.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>Published: {post.publishedAt.toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Custom Transformers

Create your own transformers to apply custom data transformations:

```tsx
import { useCollection, dateTransformer } from 'pocketbase-react-hooks';
import type { RecordTransformer } from 'pocketbase-react-hooks';

interface Post extends RecordModel {
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
}

const uppercaseTransformer: RecordTransformer<Post> = (record) => ({
  ...record,
  title: record.title.toUpperCase(),
});

const statusNormalizer: RecordTransformer<Post> = (record) => ({
  ...record,
  status: record.status.toLowerCase() as 'draft' | 'published' | 'archived',
});

function PostsList() {
  const { data: posts } = useCollection<Post>('posts', {
    transformers: [
      dateTransformer(),
      uppercaseTransformer,
      statusNormalizer,
    ]
  });

  return (
    <div>
      {posts?.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <span>{post.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### Transformer Composition

Transformers are applied in sequence, allowing you to compose multiple transformations:

```tsx
import { useCollection, dateTransformer } from 'pocketbase-react-hooks';

const trimWhitespace: RecordTransformer<Post> = (record) => ({
  ...record,
  title: record.title.trim(),
  content: record.content.trim(),
});

const addComputedFields: RecordTransformer<Post> = (record) => ({
  ...record,
  excerpt: record.content.substring(0, 100) + '...',
  wordCount: record.content.split(' ').length,
});

function PostsList() {
  const { data: posts } = useCollection<Post>('posts', {
    transformers: [
      dateTransformer(),
      trimWhitespace,
      addComputedFields,
    ]
  });

  return <div>{/* ... */}</div>;
}
```

### Disabling Transformers

If you don't want any transformations (including the default date transformer), pass an empty array:

```tsx
import { useCollection } from 'pocketbase-react-hooks';

function PostsList() {
  const { data: posts } = useCollection('posts', {
    transformers: [] // No transformations applied
  });

  return <div>{/* ... */}</div>;
}
```

### Error Handling

Transformers include built-in error handling. If a transformer throws an error, the original record is returned unchanged, and the error is logged to the console:

```tsx
const faultyTransformer: RecordTransformer<Post> = (record) => {
  if (!record.title) {
    throw new Error('Title is required');
  }
  return record;
};

function PostsList() {
  const { data: posts } = useCollection<Post>('posts', {
    transformers: [
      dateTransformer(),
      faultyTransformer, // If this fails, original record is returned
    ]
  });

  return <div>{/* ... */}</div>;
}
```

### Real-time Updates

Transformers are automatically applied to:
- Initial data fetch
- Real-time subscription events (create, update)

This ensures data consistency across all updates:

```tsx
function PostsList() {
  const { data: posts } = useCollection<Post>('posts', {
    transformers: [dateTransformer()],
  });

  return <div>{/* All posts have Date objects, even from real-time updates */}</div>;
}
```

## Real-time Features

All hooks support real-time updates through PocketBase subscriptions:

- `useCollection` automatically updates when records are created, updated, or deleted (can be disabled with `subscribe: false`)
- `useRecord` automatically updates when the specific record changes
- `useAuth` automatically updates when authentication state changes

**Note:** Real-time subscriptions are enabled by default but can be disabled using the `subscribe` option for better performance when real-time updates are not needed.

## Request Cancellation with requestKey

The `requestKey` option is passed directly to PocketBase and can be used to cancel pending requests. This is useful when you need to abort ongoing requests, for example when a component unmounts or when you want to cancel old requests in favor of new ones.

**Example:**
```tsx
import { usePocketBase } from 'pocketbase-react-hooks';

function SearchPosts({ query }: { query: string }) {
  const pb = usePocketBase();

  const { data: posts } = useCollection('posts', {
    filter: `title ~ "${query}"`,
    requestKey: 'search-posts' // Key to identify this request
  });

  // Cancel the request when needed
  const handleCancel = () => {
    pb.cancelRequest('search-posts');
  };

  return (
    <div>
      <button onClick={handleCancel}>Cancel Search</button>
      {posts?.map(post => <div key={post.id}>{post.title}</div>)}
    </div>
  );
}
```

**Use cases:**
- Cancel outdated search queries when user types fast
- Cancel requests when component unmounts
- Prevent race conditions with overlapping requests
- Better control over network usage

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
