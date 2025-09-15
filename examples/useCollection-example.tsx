import PocketBase, { type RecordModel } from 'pocketbase';
import { useState } from 'react';
import { PocketBaseProvider, useCollection } from '../src';

// Initialize PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

function App() {
  return (
    <PocketBaseProvider pocketBase={pb}>
      <CollectionExample />
    </PocketBaseProvider>
  );
}

// Collection hook usage example
function CollectionExample() {
  const [filter, setFilter] = useState('status = "published"');
  const [sort, setSort] = useState('-created');
  const [perPage, setPerPage] = useState(10);

  const {
    data: posts,
    isLoading,
    isError,
    error,
  } = useCollection('posts', {
    filter,
    sort,
    perPage,
    expand: 'author',
  });

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Posts Collection</h2>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Filter:
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value='status = "published"'>Published</option>
            <option value='status = "draft"'>Draft</option>
            <option value="">All</option>
          </select>
        </label>

        <label>
          Sort:
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="-created">Newest first</option>
            <option value="created">Oldest first</option>
            <option value="title">Title A-Z</option>
            <option value="-title">Title Z-A</option>
          </select>
        </label>

        <label>
          Per Page:
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      <div>
        {posts.map((post: RecordModel) => (
          <article key={post.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
            <h3>{post.title}</h3>
            <p>By {post.expand?.author?.name || 'Unknown'}</p>
            <p>{post.content}</p>
            <small>
              Status: {post.status} | Created: {new Date(post.created).toLocaleDateString()}
            </small>
          </article>
        ))}
      </div>
    </div>
  );
}

export default App;
