import PocketBase, { type RecordModel } from 'pocketbase';
import { type FormEvent, useState } from 'react';
import { PocketBaseProvider, useCollection, useUpdateMutation } from '../src';

const pb = new PocketBase('http://127.0.0.1:8090');

function App() {
  return (
    <PocketBaseProvider pocketBase={pb}>
      <UpdateMutationExample />
    </PocketBaseProvider>
  );
}

function UpdateMutationExample() {
  const { data: posts } = useCollection('posts', { perPage: 10 });

  const [editingId, setEditingId] = useState<string | null>(null);
  const { mutateAsync: updatePost, isPending, isSuccess, isError, error } = useUpdateMutation('posts', editingId);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'published'>('draft');

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const updatedPost = await updatePost({
        title: editTitle,
        content: editContent,
        status: editStatus,
      });
      console.log('Post updated:', updatedPost);
      setEditingId(null);
      setEditTitle('');
      setEditContent('');
    } catch (err) {
      console.error('Failed to update post:', err);
    }
  };

  const startEdit = (post: RecordModel) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditStatus(post.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  return (
    <div>
      <h2>Update Posts</h2>

      {editingId && (
        <form onSubmit={handleUpdate} style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
          <h3>Edit Post</h3>
          <div>
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Post title" required />
          </div>
          <div>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="Post content" required />
          </div>
          <div>
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'draft' | 'published')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <button type="submit" disabled={isPending}>
            {isPending ? 'Updating...' : 'Update Post'}
          </button>
          <button type="button" onClick={cancelEdit}>
            Cancel
          </button>
          {isSuccess && <p style={{ color: 'green' }}>Post updated successfully!</p>}
          {isError && error && <p style={{ color: 'red' }}>Error: {error}</p>}
        </form>
      )}

      <div>
        <h3>Existing Posts</h3>
        {posts?.map((post: RecordModel) => (
          <div key={post.id} style={{ border: '1px solid #eee', padding: '10px', margin: '10px 0' }}>
            <h4>{post.title}</h4>
            <p>{post.content}</p>
            <small>
              Status: {post.status} | Created: {new Date(post.created).toLocaleDateString()}
            </small>
            <div style={{ marginTop: '10px' }}>
              <button type="button" onClick={() => startEdit(post)}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
