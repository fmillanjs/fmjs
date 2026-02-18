'use client';

type PostResult = {
  id: string;
  title: string;
  status: string;
  headline: string;
  workspaceId: string;
  authorId: string;
};

type SnippetResult = {
  id: string;
  title: string;
  language: string;
  headline: string;
  workspaceId: string;
  authorId: string;
};

type SearchResultsData = {
  posts: PostResult[];
  snippets: SnippetResult[];
};

type Props = {
  results: SearchResultsData | null;
  loading: boolean;
  slug: string;
};

export default function SearchResults({ results, loading, slug }: Props) {
  if (loading) {
    return (
      <div style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '13px' }}>
        Searching...
      </div>
    );
  }

  if (!results) return null;

  const hasPosts = results.posts.length > 0;
  const hasSnippets = results.snippets.length > 0;
  const isEmpty = !hasPosts && !hasSnippets;

  if (isEmpty) {
    return (
      <div style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '13px' }}>
        No results found.
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {hasPosts && (
        <section>
          <div
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '11px',
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderTop: '1px solid #f3f4f6',
            }}
          >
            Posts
          </div>
          {results.posts.map((post) => (
            <a
              key={post.id}
              href={`/w/${slug}/posts/${post.id}`}
              style={{
                display: 'block',
                padding: '0.625rem 1.25rem',
                textDecoration: 'none',
                borderBottom: '1px solid #f9fafb',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              }}
            >
              <div style={{ fontWeight: 500, fontSize: '14px', color: '#111827', marginBottom: '2px' }}>
                {post.title}
                {post.status === 'Draft' && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: '#9ca3af' }}>(Draft)</span>
                )}
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: post.headline }}
                style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}
              />
            </a>
          ))}
        </section>
      )}

      {hasSnippets && (
        <section>
          <div
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '11px',
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderTop: '1px solid #f3f4f6',
            }}
          >
            Snippets
          </div>
          {results.snippets.map((snippet) => (
            <a
              key={snippet.id}
              href={`/w/${slug}/snippets/${snippet.id}`}
              style={{
                display: 'block',
                padding: '0.625rem 1.25rem',
                textDecoration: 'none',
                borderBottom: '1px solid #f9fafb',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span style={{ fontWeight: 500, fontSize: '14px', color: '#111827' }}>
                  {snippet.title}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  {snippet.language}
                </span>
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: snippet.headline }}
                style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5, fontFamily: 'monospace' }}
              />
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
