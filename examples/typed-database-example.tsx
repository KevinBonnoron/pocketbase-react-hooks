import PocketBase from 'pocketbase';
import { PocketBaseProvider, TypedPocketBase, useCollection, useRecord, useAuth } from '../src';
import type { AuthRecord, RecordModel } from 'pocketbase';

interface PostsResponse extends RecordModel {
  id: string;
  title: string;
  content: string;
  author: string;
}

interface UsersResponse extends AuthRecord {
  id: string;
  username: string;
  email: string;
  name: string;
}

interface Database extends Record<string, RecordModel> {
  posts: PostsResponse;
  users: UsersResponse;
}

const pb = new PocketBase('http://127.0.0.1:8090') as TypedPocketBase<Database>;

function App() {
  return (
    <PocketBaseProvider<Database> pocketBase={pb}>
      <Posts />
      <Auth />
    </PocketBaseProvider>
  );
}

function Posts() {
  const { data: posts, isLoading } = useCollection('posts');

  if (isLoading) return <div>Loading...</div>;
  if (!posts) return null;

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}

function SinglePost({ postId }: { postId: string }) {
  const { data: post } = useRecord('posts', postId);

  if (!post) return null;

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <p>By: {post.author}</p>
    </div>
  );
}

function Auth() {
  const { user, signIn, signOut } = useAuth();

  const handleLogin = async () => {
    const user = await signIn.email('test@example.com', 'password');
    if (user) {
      console.log('Logged in as:', user.username);
    }
  };

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.name}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Sign In</button>
      )}
    </div>
  );
}

export default App;
