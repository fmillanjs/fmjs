'use client';
import { SNIPPET_LANGUAGES } from '../../lib/shiki';

interface Props {
  value: string;
  onChange: (lang: string) => void;
}

export default function LanguageSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
    >
      {SNIPPET_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {lang}
        </option>
      ))}
    </select>
  );
}
