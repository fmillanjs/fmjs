'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactSyntaxHighlighter from 'react-syntax-highlighter';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface Props {
  initialTitle?: string;
  initialContent?: string;
  initialStatus?: 'Draft' | 'Published';
  onSave: (title: string, content: string, status: 'Draft' | 'Published') => Promise<void>;
  saving?: boolean;
  error?: string;
}

export default function PostEditor({
  initialTitle = '',
  initialContent = '',
  onSave,
  saving = false,
  error = '',
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title..."
          required
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '1.25rem',
            fontWeight: 600,
            border: '1px solid #d1d5db',
            borderRadius: '4px',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          height: '60vh',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Write</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write Markdown here... Use ``` for code blocks."
            style={{
              flex: 1,
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              resize: 'none',
              lineHeight: 1.6,
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Preview</h3>
          <div
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              overflowY: 'auto',
              background: '#f9fafb',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className ?? '');
                  const isBlock = !props.ref && match;
                  return isBlock ? (
                    <ReactSyntaxHighlighter
                      style={githubGist}
                      language={match![1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, '')}
                    </ReactSyntaxHighlighter>
                  ) : (
                    <code
                      className={className}
                      style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content || '*Nothing to preview yet...*'}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {error && <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => onSave(title, content, 'Draft')}
          disabled={saving || !title.trim()}
          style={{
            padding: '10px 20px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          onClick={() => onSave(title, content, 'Published')}
          disabled={saving || !title.trim()}
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {saving ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
