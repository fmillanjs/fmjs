import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Plugin } from 'unified';
import type { Root, Element, Text } from 'hast';
import { visit } from 'unist-util-visit';
import { getHighlighter } from '../../lib/shiki';

// Custom rehype plugin: replaces <code class="language-X"> nodes with Shiki-highlighted HTML.
// Runs entirely on the server — no WASM shipped to the browser.
function rehypeShikiPlugin(): Plugin<[], Root> {
  return () => async (tree: Root) => {
    const highlighter = await getHighlighter();
    const promises: Promise<void>[] = [];

    visit(tree, 'element', (node: Element, index, parent) => {
      if (
        node.tagName !== 'code' ||
        !parent ||
        (parent as Element).tagName !== 'pre'
      ) return;

      const classNames = (node.properties?.className as string[] | undefined) ?? [];
      const langClass = classNames.find((c) => c.startsWith('language-'));
      const lang = langClass ? langClass.replace('language-', '') : 'text';
      const rawCode = (node.children[0] as Text | undefined)?.value ?? '';

      promises.push(
        (async () => {
          const html = highlighter.codeToHtml(rawCode, {
            lang: lang ?? 'text',
            theme: 'github-dark',
          });

          // Replace the <pre><code> node pair with raw Shiki HTML
          const preNode = parent as Element;
          preNode.tagName = 'div';
          preNode.properties = { className: ['shiki-wrapper'], style: 'margin: 1em 0' };
          preNode.children = [
            {
              type: 'raw' as never,
              value: html,
            } as never,
          ];
        })()
      );
    });

    await Promise.all(promises);
  };
}

interface Props {
  content: string;
}

// Server Component — no 'use client'. Shiki runs server-side via rehype plugin.
export default function MarkdownRenderer({ content }: Props) {
  return (
    <article
      style={{
        maxWidth: '720px',
        lineHeight: 1.7,
        fontSize: '16px',
        color: '#111827',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeShikiPlugin() as never]}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
