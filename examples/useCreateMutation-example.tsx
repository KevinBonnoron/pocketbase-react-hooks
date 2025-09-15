import PocketBase, { type RecordModel } from 'pocketbase';
import { type FormEvent, useState } from 'react';
import { PocketBaseProvider, useCollection, useCreateMutation } from '../src';

const pb = new PocketBase('http://127.0.0.1:8090');

function App() {
  return (
    <PocketBaseProvider pocketBase={pb}>
      <CreateMutationExample />
    </PocketBaseProvider>
  );
}

function CreateMutationExample() {
  const { mutate: createPost, isPending, isSuccess, error } = useCreateMutation('posts');
  const { data: posts } = useCollection('posts', { perPage: 10 });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const newPost = await createPost({
        title,
        content,
        status,
      });
      console.log('Post created:', newPost);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Create Post</h2>

      <form onSubmit={handleCreate} style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h3>Create New Post</h3>
        <div>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" required />
        </div>
        <div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Post content" required />
        </div>
        <div>
          <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Post'}
        </button>
        {isSuccess && <p style={{ color: 'green' }}>Post created successfully!</p>}
      </form>

      <div>
        <h3>Existing Posts</h3>
        {posts?.map((post: RecordModel) => (
          <div key={post.id} style={{ border: '1px solid #eee', padding: '10px', margin: '10px 0' }}>
            <h4>{post.title}</h4>
            <p>{post.content}</p>
            <small>
              Status: {post.status} | Created: {new Date(post.created).toLocaleDateString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
