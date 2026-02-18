'use client';
import BellIcon from './notifications/BellIcon';

export default function WorkspaceNav({ slug }: { slug: string }) {
  return (
    <nav
      style={{
        padding: '0.75rem 2rem',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: '15px' }}>Workspace: {slug}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <a
          href={`/w/${slug}`}
          style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}
        >
          Overview
        </a>
        <a
          href={`/w/${slug}/posts`}
          style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}
        >
          Posts
        </a>
        <a
          href={`/w/${slug}/snippets`}
          style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}
        >
          Snippets
        </a>
        <a
          href={`/w/${slug}/activity`}
          style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}
        >
          Activity
        </a>
        <BellIcon />
        <a
          href="/dashboard"
          style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}
        >
          Dashboard
        </a>
      </div>
    </nav>
  );
}
