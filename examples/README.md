# Examples

This directory contains usage examples for the PocketBase React Hooks library.

## Individual Hook Examples

- `useAuth-example.tsx` - Complete authentication example with email and social sign-in methods
- `useCollection-example.tsx` - Collection fetching with filters, sorting, and pagination
- `useRecord-example.tsx` - Single record fetching with expand options
- `useCreateMutation-example.tsx` - Create record operations
- `useUpdateMutation-example.tsx` - Update record operations
- `useDeleteMutation-example.tsx` - Delete record operations

## Database Schema Example

First, here's an example of a PocketBase database schema you might use:

### Collections

**users** (Auth collection)
- `email` (email, required, unique)
- `password` (text, required, min: 8)
- `name` (text, required)
- `avatar` (file, optional)

**posts** (Regular collection)
- `title` (text, required)
- `content` (text, required)
- `status` (select: draft, published, archived)
- `author` (relation to users)
- `tags` (json array)
- `publishedAt` (date, optional)

**comments** (Regular collection)
- `content` (text, required)
- `post` (relation to posts)
- `author` (relation to users)
- `created` (date, auto)

## Basic Usage

Here's a simple example showing how to use the hooks:

```tsx
import React from 'react';
import PocketBase from 'pocketbase';
import { 
  PocketBaseProvider, 
  useAuth, 
  useCollection 
} from 'pocketbase-react-hooks';

// Initialize PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

function App() {
  return (
    <PocketBaseProvider pocketBase={pb}>
      <div>
        <h1>PocketBase Hooks Usage Example</h1>
        <AuthExample />
        <CollectionExample />
      </div>
    </PocketBaseProvider>
  );
}

// Authentication hook usage example
function AuthExample() {
  const { user, isAuthenticated, signIn, signUp, signOut } = useAuth();

  if (isAuthenticated) {
    return (
      <div>
        <p>Logged in as: {user?.email}</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return (
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
  );
}

// Collection hook usage example
function CollectionExample() {
  const { data: posts, isLoading, isError, error } = useCollection('posts', {
    perPage: 10,
    sort: '-created'
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

## Advanced Usage

### Custom Authentication

```tsx
import { useState } from 'react';
import { useAuth } from 'pocketbase-react-hooks';

function LoginForm() {
  const { signIn, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn.email(email, password, { expand: 'profile' });
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

### Collection with Filters

```tsx
import { useCollection } from 'pocketbase-react-hooks';

function FilteredPosts() {
  const { data: posts, isLoading, isError, error } = useCollection('posts', {
    filter: 'status = "published"',
    sort: '-created',
    perPage: 20,
    expand: 'author'
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Published Posts</h2>
      <div>
        {posts.map((post) => (
          <article key={post.id}>
            <h3>{post.title}</h3>
            <p>By {post.expand?.author?.name}</p>
            <p>{post.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
```

### Single Record

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
      <p>By {post.expand?.author?.name}</p>
      <div>{post.content}</div>
      {post.expand?.comments && (
        <div>
          <h3>Comments</h3>
          {post.expand.comments.map((comment) => (
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
      <p>By {post.expand?.author?.name}</p>
      <div>{post.content}</div>
    </article>
  );
}
```

### Mutations

#### Create Mutation
```tsx
import { useCreateMutation } from 'pocketbase-react-hooks';

function CreatePost() {
  const { mutate: createPost, isPending, isSuccess, error } = useCreateMutation('posts');

  const handleCreate = async () => {
    try {
      const newPost = await createPost({
        title: 'New Post',
        content: 'This is a new post',
        status: 'draft'
      });
      console.log('Post created:', newPost);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      {isSuccess && <p>Post created successfully!</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

#### Update Mutation
```tsx
import { useUpdateMutation } from 'pocketbase-react-hooks';

function EditPost({ postId }: { postId: string }) {
  const { mutate: updatePost, isPending, isSuccess, error } = useUpdateMutation('posts');

  const handleUpdate = async () => {
    try {
      const updatedPost = await updatePost(postId, {
        title: 'Updated Post',
        content: 'This post has been updated',
        status: 'published'
      });
      console.log('Post updated:', updatedPost);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  return (
    <div>
      <button onClick={handleUpdate} disabled={isPending}>
        {isPending ? 'Updating...' : 'Update Post'}
      </button>
      {isSuccess && <p>Post updated successfully!</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

#### Delete Mutation
```tsx
import { useDeleteMutation } from 'pocketbase-react-hooks';

function DeletePost({ postId }: { postId: string }) {
  const { mutate: deletePost, isPending, isSuccess, error } = useDeleteMutation('posts');

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const success = await deletePost(postId);
        if (success) {
          console.log('Post deleted successfully');
        }
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={isPending}>
        {isPending ? 'Deleting...' : 'Delete Post'}
      </button>
      {isSuccess && <p>Post deleted successfully!</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## Running Examples

To run the examples locally:

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start your PocketBase server:
   ```bash
   pocketbase serve
   ```

3. Run the example:
   ```bash
   bun run examples/basic-usage.tsx
   ```

## Complete Example with All Hooks

Here's a more comprehensive example showing all available hooks:

```tsx
import React, { useState } from 'react';
import PocketBase from 'pocketbase';
import { 
  PocketBaseProvider, 
  useAuth, 
  useCollection,
  useCreateMutation,
  useUpdateMutation,
  useDeleteMutation
} from 'pocketbase-react-hooks';

const pb = new PocketBase('http://127.0.0.1:8090');

function App() {
  return (
    <PocketBaseProvider pocketBase={pb}>
      <div>
        <h1>Complete PocketBase Hooks Example</h1>
        <AuthSection />
        <PostsSection />
        <CreatePostSection />
      </div>
    </PocketBaseProvider>
  );
}

function AuthSection() {
  const { user, isAuthenticated, signIn, signUp, signOut, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.email}!</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button 
        onClick={() => signIn.email(email, password, { expand: 'profile' })}
        disabled={isLoading}
      >
        Sign In
      </button>
      <button 
        onClick={() => signIn.social('google')}
        disabled={isLoading}
      >
        Sign In with Google
      </button>
      <button 
        onClick={() => signUp.email(email, password, {
          additionalData: { name: 'New User' },
          expand: 'profile'
        })}
        disabled={isLoading}
      >
        Sign Up
      </button>
    </div>
  );
}

function PostsSection() {
  const { data: posts, isLoading, isError, error } = useCollection('posts', {
    filter: 'status = "published"',
    sort: '-created',
    expand: 'author'
  });

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Published Posts</h2>
      {posts.map((post) => (
        <article key={post.id}>
          <h3>{post.title}</h3>
          <p>By {post.expand?.author?.name || 'Unknown'}</p>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}

function CreatePostSection() {
  const { mutate: createPost, isPending, isSuccess, error } = useCreateMutation('posts');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = async () => {
    const newPost = await createPost({
      title,
      content,
      status: 'draft'
    });
    
    if (newPost) {
      setTitle('');
      setContent('');
      console.log('Post created:', newPost);
    }
  };

  return (
    <div>
      <h2>Create New Post</h2>
      <input 
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
      />
      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Post content"
      />
      <button onClick={handleCreate} disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      {isSuccess && <p>Post created successfully!</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}

export default App;
```
