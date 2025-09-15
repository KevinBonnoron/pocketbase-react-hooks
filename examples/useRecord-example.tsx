import PocketBase, { type RecordModel } from 'pocketbase';
import { useState } from 'react';
import { PocketBaseProvider, useRecord } from '../src';

// Initialize PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

interface Author extends RecordModel {
  name: string;
}

interface Comment extends RecordModel {
  content: string;
}

interface Post extends RecordModel {
  title: string;
  content: string;
  status: string;
  author: string;
  created: string;
  expand: {
    author: Author;
    comments: Comment[];
  };
}

function App() {
  return (
    <PocketBaseProvider pocketBase={pb}>
      <RecordExample />
    </PocketBaseProvider>
  );
}

// Single record hook usage example
function RecordExample() {
  const [postId, setPostId] = useState('example-post-id');
  const [postSlug, setPostSlug] = useState('my-awesome-post');
  const [expand, setExpand] = useState('author,comments');
  const [fetchBy, setFetchBy] = useState<'id' | 'filter'>('id');

  const {
    data: post,
    isLoading,
    isError,
    error,
  } = useRecord<Post>('posts', fetchBy === 'id' ? postId : `slug="${postSlug}"`, {
    expand,
  });

  if (isLoading) return <div>Loading post...</div>;
  if (isError) return <div>Error: {error}</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div>
      <h2>Single Post</h2>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Fetch by:
          <select value={fetchBy} onChange={(e) => setFetchBy(e.target.value as 'id' | 'filter')}>
            <option value="id">ID</option>
            <option value="filter">Filter (slug)</option>
          </select>
        </label>

        {fetchBy === 'id' ? (
          <label>
            Post ID:
            <input type="text" value={postId} onChange={(e) => setPostId(e.target.value)} placeholder="Enter post ID" />
          </label>
        ) : (
          <label>
            Post Slug:
            <input type="text" value={postSlug} onChange={(e) => setPostSlug(e.target.value)} placeholder="Enter post slug" />
          </label>
        )}

        <label>
          Expand:
          <select value={expand} onChange={(e) => setExpand(e.target.value)}>
            <option value="">None</option>
            <option value="author">Author only</option>
            <option value="author,comments">Author and Comments</option>
          </select>
        </label>
      </div>

      <article style={{ border: '1px solid #ccc', padding: '20px' }}>
        <h1>{post.title}</h1>
        <p>
          <strong>By:</strong> {post.expand?.author?.name || 'Unknown'}
        </p>
        <p>
          <strong>Status:</strong> {post.status}
        </p>
        <p>
          <strong>Created:</strong> {new Date(post.created).toLocaleDateString()}
        </p>

        <div style={{ marginTop: '20px' }}>
          <h3>Content</h3>
          <div>{post.content}</div>
        </div>

        {post.expand?.comments && (
          <div style={{ marginTop: '20px' }}>
            <h3>Comments ({post.expand.comments.length})</h3>
            {post.expand.comments.map((comment) => (
              <div key={comment.id} style={{ border: '1px solid #eee', padding: '10px', margin: '5px 0' }}>
                <p>{comment.content}</p>
                <small>
                  By {comment.expand?.author?.name || 'Unknown'} - {new Date(comment.created).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

export default App;
