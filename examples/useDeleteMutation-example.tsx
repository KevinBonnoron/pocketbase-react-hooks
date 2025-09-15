import PocketBase, { type RecordModel } from 'pocketbase';
import { useState } from 'react';
import { PocketBaseProvider, useCollection, useDeleteMutation } from '../src';

const pb = new PocketBase('http://127.0.0.1:8090');

function App() {
  return (
    <PocketBaseProvider pocketBase={pb}>
      <DeleteMutationExample />
    </PocketBaseProvider>
  );
}

function DeleteMutationExample() {
  const { mutate: deletePost, isPending, isSuccess, error } = useDeleteMutation('posts');
  const { data: posts } = useCollection('posts', { perPage: 10 });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setDeletingId(id);
      try {
        const success = await deletePost(id);
        if (success) {
          console.log('Post deleted successfully');
        }
      } catch (err) {
        console.error('Failed to delete post:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Delete Posts</h2>
      {isSuccess && <p style={{ color: 'green' }}>Post deleted successfully!</p>}

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
              <button
                type="button"
                onClick={() => handleDelete(post.id)}
                disabled={isPending && deletingId === post.id}
                style={{
                  backgroundColor: deletingId === post.id ? '#ff6b6b' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: deletingId === post.id ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending && deletingId === post.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
