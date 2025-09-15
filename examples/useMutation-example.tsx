import PocketBase, { type RecordModel } from 'pocketbase';
import { type FormEvent, useState } from 'react';
import { PocketBaseProvider, useCollection, useMutation } from '../src';

// Initialize PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

function App() {
  return (
    <PocketBaseProvider pocketBase={pb}>
      <MutationExample />
    </PocketBaseProvider>
  );
}

// Mutation hook usage example
function MutationExample() {
  const { create, update, remove, isPending, isError, error } = useMutation('posts');
  const { data: posts } = useCollection('posts', { perPage: 10 });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const newPost = await create({
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

  const handleUpdate = async (id: string) => {
    try {
      const updatedPost = await update(id, {
        title: editTitle,
        content: editContent,
      });
      console.log('Post updated:', updatedPost);
      setEditingId(null);
      setEditTitle('');
      setEditContent('');
    } catch (err) {
      console.error('Failed to update post:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const success = await remove(id);
        if (success) {
          console.log('Post deleted successfully');
        }
      } catch (err) {
        console.error('Failed to delete post:', err);
      }
    }
  };

  const startEdit = (post: RecordModel) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  if (isError) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Post Mutations</h2>

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
      </form>

      <div>
        <h3>Existing Posts</h3>
        {posts?.map((post: RecordModel) => (
          <div key={post.id} style={{ border: '1px solid #eee', padding: '10px', margin: '10px 0' }}>
            {editingId === post.id ? (
              <div>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Post title" />
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="Post content" />
                <button type="button" onClick={() => handleUpdate(post.id)} disabled={isPending}>
                  {isPending ? 'Updating...' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <h4>{post.title}</h4>
                <p>{post.content}</p>
                <small>
                  Status: {post.status} | Created: {new Date(post.created).toLocaleDateString()}
                </small>
                <div style={{ marginTop: '10px' }}>
                  <button type="button" onClick={() => startEdit(post)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(post.id)} disabled={isPending}>
                    {isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
