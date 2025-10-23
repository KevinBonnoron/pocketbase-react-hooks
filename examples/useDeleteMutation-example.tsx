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
  const { data: posts } = useCollection('posts', { perPage: 10 });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { mutateAsync: deletePost, isPending, isSuccess, isError, error } = useDeleteMutation('posts', deletingId);

  const handleDelete = async (postId: string) => {
    if (isPending) {
      return;
    }

    setDeletingId(postId);
    try {
      await deletePost();
      console.log('Post deleted successfully');
    } catch (err) {
      console.error('Failed to delete post:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (post: RecordModel) => {
    if (window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
      handleDelete(post.id);
    }
  };

  if (isError) return <div>Error: {error}</div>;

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
                onClick={() => confirmDelete(post)}
                disabled={isPending}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
