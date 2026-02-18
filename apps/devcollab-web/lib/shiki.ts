import { createHighlighter } from 'shiki';

// Singleton: createHighlighter is expensive — reuse across requests
let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

// Exported so plan 17-04's MarkdownRenderer rehype plugin can call it directly
// (bypasses the async highlight() wrapper and calls codeToHtml with custom options)
export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [
        'bash', 'c', 'cpp', 'css', 'go', 'html', 'java',
        'javascript', 'json', 'kotlin', 'markdown', 'php',
        'python', 'ruby', 'rust', 'sql', 'swift', 'text',
        'typescript', 'yaml',
      ],
    });
  }
  return highlighterPromise;
}

export async function highlight(code: string, lang: string): Promise<string> {
  const hl = await getHighlighter();
  // Fallback to 'text' if language not in the bundle
  const safeLang = hl.getLoadedLanguages().includes(lang as never) ? lang : 'text';
  return hl.codeToHtml(code, { lang: safeLang as never, theme: 'github-dark' });
}

export const SNIPPET_LANGUAGES = [
  'bash', 'c', 'cpp', 'css', 'go', 'html', 'java',
  'javascript', 'json', 'kotlin', 'markdown', 'php',
  'python', 'ruby', 'rust', 'sql', 'swift', 'text',
  'typescript', 'yaml',
] as const;

export type SnippetLanguage = typeof SNIPPET_LANGUAGES[number];
