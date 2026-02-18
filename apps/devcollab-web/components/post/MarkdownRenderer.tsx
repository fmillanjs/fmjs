import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { toHtml } from 'hast-util-to-html';
import type { Root, Element, Text } from 'hast';
import { visit } from 'unist-util-visit';
import { getHighlighter } from '../../lib/shiki';

// Server Component — no 'use client'. Shiki runs server-side.
// Uses unified pipeline directly so the async Shiki plugin is properly awaited,
// then renders the final HTML string via dangerouslySetInnerHTML.
async function processMarkdown(content: string): Promise<string> {
  const highlighter = await getHighlighter();

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(() => async (tree: Root) => {
      const promises: Promise<void>[] = [];

      visit(tree, 'element', (node: Element, _index, parent) => {
        if (
          node.tagName !== 'code' ||
          !parent ||
          (parent as Element).tagName !== 'pre'
        )
          return;

        const classNames =
          (node.properties?.className as string[] | undefined) ?? [];
        const langClass = classNames.find((c) => c.startsWith('language-'));
        const lang = langClass ? langClass.replace('language-', '') : 'text';
        const rawCode = (node.children[0] as Text | undefined)?.value ?? '';

        promises.push(
          (async () => {
            const shikiHtml = highlighter.codeToHtml(rawCode, {
              lang,
              theme: 'github-dark',
            });

            const preNode = parent as Element;
            preNode.tagName = 'div';
            preNode.properties = {
              className: ['shiki-wrapper'],
              style: 'margin: 1em 0',
            };
            preNode.children = [
              { type: 'raw', value: shikiHtml } as never,
            ];
          })()
        );
      });

      await Promise.all(promises);
    });

  const tree = await processor.run(processor.parse(content));
  return toHtml(tree as Root, { allowDangerousHtml: true });
}

interface Props {
  content: string;
}

export default async function MarkdownRenderer({ content }: Props) {
  const html = await processMarkdown(content);
  return (
    <article
      style={{
        maxWidth: '720px',
        lineHeight: 1.7,
        fontSize: '16px',
        color: '#111827',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
