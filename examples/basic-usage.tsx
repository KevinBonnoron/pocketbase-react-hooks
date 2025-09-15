import PocketBase, { type RecordModel } from 'pocketbase';
import { PocketBaseProvider, useAuth, useCollection } from '../src';

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
  const { user, isAuthenticated, signIn, signOut } = useAuth();

  if (isAuthenticated) {
    return (
      <div>
        <p>Logged in as: {user?.email}</p>
        <button type="button" onClick={signOut}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => signIn('user@example.com', 'password')}>
        Sign In
      </button>
    </div>
  );
}

// Collection hook usage example
function CollectionExample() {
  const {
    data: posts,
    isLoading,
    isError,
    error,
  } = useCollection('posts', {
    perPage: 10,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Posts</h2>
      <ul>
        {posts?.map((post: RecordModel) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
