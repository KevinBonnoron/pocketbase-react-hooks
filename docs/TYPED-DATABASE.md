# Using PocketBase React Hooks with pocketbase-typegen

This library now supports automatic type inference when used with [pocketbase-typegen](https://github.com/patmood/pocketbase-typegen), providing end-to-end type safety for your PocketBase collections.

## Features

- **Type-safe collection names**: TypeScript will autocomplete and validate collection names
- **Automatic type inference**: Hook return types are inferred from your database schema
- **Zero runtime overhead**: All types are compile-time only
- **Backward compatible**: Works with existing code without any changes

## Setup

### 1. Generate types with pocketbase-typegen

First, generate TypeScript types from your PocketBase schema:

```bash
npx pocketbase-typegen --url http://127.0.0.1:8090 --email admin@example.com --password admin123 --out src/pocketbase-types.ts
```

This will generate a file like:

```typescript
// src/pocketbase-types.ts
export interface PostsResponse extends RecordModel {
  id: string;
  title: string;
  content: string;
  author: string;
  published: boolean;
}

export interface UsersResponse extends AuthRecord {
  id: string;
  username: string;
  email: string;
  name: string;
}

// ... other collections
```

### 2. Create a Database type

Create a type (not interface) that maps collection names to their response types:

```typescript
// src/database.ts
import type { PostsResponse, UsersResponse } from './pocketbase-types';

export type Database = {
  posts: PostsResponse;
  users: UsersResponse;
};
```

**Important:** Use `type` instead of `interface` for the Database definition. TypeScript requires types that satisfy `Record<string, RecordModel>` to have an index signature, which is easier to achieve with type aliases.

### 3. Type your PocketBase instance and Provider

Cast your PocketBase instance as `TypedPocketBase<Database>` and pass the Database type to the Provider:

```typescript
import PocketBase from 'pocketbase';
import { PocketBaseProvider, TypedPocketBase } from 'pocketbase-react-hooks';
import type { Database } from './database';

const pb = new PocketBase('http://127.0.0.1:8090') as TypedPocketBase<Database>;

function App() {
  return (
    <PocketBaseProvider<Database> pocketBase={pb}>
      <YourApp />
    </PocketBaseProvider>
  );
}
```

## Usage

### useCollection

Types are automatically inferred from the collection name:

```typescript
function Posts() {
  // ✅ Type inferred: QueryResult<PostsResponse[]>
  const { data: posts, isLoading } = useCollection('posts');

  // ✅ TypeScript knows post.title, post.content exist
  return posts.map(post => (
    <div key={post.id}>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
    </div>
  ));
}
```

You can still use explicit types if needed:

```typescript
// Still works for backward compatibility
const { data } = useCollection<PostsResponse>('posts');
```

### useRecord

```typescript
function Post({ id }: { id: string }) {
  // ✅ Type inferred: QueryResult<PostsResponse | null>
  const { data: post } = useRecord('posts', id);

  if (!post) return null;

  // ✅ TypeScript knows all post fields
  return <h1>{post.title}</h1>;
}
```

### useAuth

```typescript
function Auth() {
  // ✅ Type inferred: UsersResponse | null
  const { user, signIn, signOut } = useAuth();

  // ✅ TypeScript knows user.username exists
  return user ? <p>Hello, {user.username}!</p> : <button onClick={...}>Login</button>;
}

// With custom auth collection
function AdminAuth() {
  // ✅ Type inferred from 'admins' collection
  const { user } = useAuth({ collectionName: 'admins' });

  return <p>Admin: {user?.email}</p>;
}
```

### Mutation Hooks

```typescript
function CreatePost() {
  // ✅ Type inferred: UseCreateMutationResult<PostsResponse>
  const { mutateAsync, isPending } = useCreateMutation('posts');

  const handleCreate = async () => {
    // ✅ TypeScript validates the shape of data
    const post = await mutateAsync({
      title: 'My Post',
      content: 'Hello world',
      author: 'user123',
      published: true
    });

    // ✅ post is typed as PostsResponse
    console.log(post.id, post.title);
  };

  return <button onClick={handleCreate} disabled={isPending}>Create Post</button>;
}
```

### useUpdateMutation

```typescript
function EditPost({ id }: { id: string }) {
  // ✅ Type inferred from collection name
  const { mutateAsync } = useUpdateMutation('posts', id);

  const handleUpdate = async () => {
    // ✅ Partial<PostsResponse> is inferred
    await mutateAsync({ title: 'Updated Title' });
  };

  return <button onClick={handleUpdate}>Update</button>;
}
```

### useDeleteMutation

```typescript
function DeletePost({ id }: { id: string }) {
  // ✅ Collection name is type-checked
  const { mutateAsync } = useDeleteMutation('posts', id);

  return <button onClick={() => mutateAsync()}>Delete</button>;
}
```

## Type Safety Benefits

### 1. Collection Name Validation

TypeScript will catch typos in collection names:

```typescript
// ❌ TypeScript error: "post" is not in Database
const { data } = useCollection('post');

// ✅ Correct
const { data } = useCollection('posts');
```

### 2. Field Autocomplete

Your IDE will autocomplete collection names and record fields:

```typescript
const { data: posts } = useCollection('p'); // IDE suggests 'posts'

posts[0].t // IDE suggests 'title', 'content', etc.
```

### 3. Type-safe Mutations

Mutation payloads are validated:

```typescript
const { mutateAsync } = useCreateMutation('posts');

// ❌ TypeScript error: 'ttle' is not a valid field
await mutateAsync({ ttle: 'Hello' });

// ✅ Correct
await mutateAsync({ title: 'Hello', content: 'World' });
```

## Backward Compatibility

All existing code continues to work without changes:

```typescript
// ✅ Still works - uses RecordModel as fallback
<PocketBaseProvider pocketBase={pb}>

// ✅ Still works - explicit generic
const { data } = useCollection<MyType>('collection');

// ✅ Still works - no generics
const { data } = useCollection('collection');
```

## Best Practices

1. **Keep types in sync**: Regenerate types whenever your PocketBase schema changes
2. **Use a single Database type**: Define one central Database type for your entire app
3. **Use `type` not `interface`**: Always use `type` for your Database definition to satisfy TypeScript's `Record<string, RecordModel>` constraint
4. **Leverage type inference**: Let TypeScript infer types from collection names instead of manually specifying generics
5. **Type your PocketBase instance**: Always cast your PocketBase instance as `TypedPocketBase<Database>`

## Troubleshooting

### Types not being inferred

Make sure you:
1. Cast your PocketBase instance as `TypedPocketBase<Database>`
2. Pass the Database generic to `PocketBaseProvider<Database>`
3. Don't explicitly pass a generic to hooks (let TypeScript infer it)

### Collection name not autocompleting

Ensure your Database type includes all collections:

```typescript
type Database = {
  posts: PostsResponse;
  users: UsersResponse;
  comments: CommentsResponse; // Don't forget any collections!
};
```

### Error: "Index signature for type 'string' is missing"

This error occurs when using `interface` instead of `type` for your Database definition. Use `type` instead:

```typescript
// ❌ Wrong - causes error
interface Database {
  posts: PostsResponse;
}

// ✅ Correct
type Database = {
  posts: PostsResponse;
};
```

### Getting RecordModel instead of specific type

Check that:
1. The collection name matches a key in your Database type (case-sensitive)
2. You're not explicitly passing a generic that overrides inference
3. Your Provider is typed: `<PocketBaseProvider<Database> pocketBase={pb}>`
