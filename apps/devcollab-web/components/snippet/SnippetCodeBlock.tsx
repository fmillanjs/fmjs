import { highlight } from '../../lib/shiki';
import CopyButton from './CopyButton';

interface Props {
  code: string;
  lang: string;
}

// CRITICAL: async Server Component — no 'use client' directive
// Shiki runs server-side only; zero Shiki JS sent to browser
export default async function SnippetCodeBlock({ code, lang }: Props) {
  const html = await highlight(code, lang);

  return (
    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
      <CopyButton code={code} />
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ fontSize: '14px', lineHeight: '1.5' }}
      />
    </div>
  );
}
