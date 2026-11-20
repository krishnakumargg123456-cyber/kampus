import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const formatInline = (text: string): React.ReactNode[] => {
  // Split inline code `...`, bold **...**, math $...$
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\$[^$]+\$)/g);
  return tokens.map((tok, idx) => {
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/80 font-mono text-[0.88em] text-blue-700 dark:text-blue-300"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith('$') && tok.endsWith('$') && tok.length > 2) {
      return (
        <span
          key={idx}
          className="px-1 font-serif italic text-slate-900 dark:text-slate-100 bg-slate-100/80 dark:bg-slate-800/80 rounded"
        >
          {tok.slice(1, -1)}
        </span>
      );
    }
    return <React.Fragment key={idx}>{tok}</React.Fragment>;
  });
};

const CodeBlock: React.FC<{ lang: string; code: string }> = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-[11px] text-slate-300 font-mono">
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = (content || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(<CodeBlock key={`cb-${i}`} lang={lang} code={codeLines.join('\n')} />);
      i++;
      continue;
    }

    // Display math blocks $$...$$
    if (line.trim().startsWith('$$')) {
      const mathLines: string[] = [];
      if (line.trim().endsWith('$$') && line.trim().length > 4) {
        mathLines.push(line.trim().slice(2, -2));
        i++;
      } else {
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('$$')) {
          mathLines.push(lines[i]);
          i++;
        }
        i++;
      }
      blocks.push(
        <div
          key={`math-${i}`}
          className="my-2.5 px-4 py-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-serif italic text-sm text-slate-900 dark:text-slate-100 overflow-x-auto text-center"
        >
          {mathLines.join(' ')}
        </div>
      );
      continue;
    }

    // Markdown table
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const headerCells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(
          lines[i]
            .split('|')
            .map((c) => c.trim())
            .filter(Boolean)
        );
        i++;
      }
      blocks.push(
        <div key={`tbl-${i}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
              <tr>
                {headerCells.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                    {formatInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={i} className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 mt-3 mb-1">
          {formatInline(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={i} className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-3.5 mb-1">
          {formatInline(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push(
        <h2 key={i} className="text-lg sm:text-xl font-extrabold text-blue-700 dark:text-blue-400 mt-3.5 mb-1.5">
          {formatInline(line.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // Bullet list items
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="my-1.5 ml-5 list-disc space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
          {items.map((it, idx) => (
            <li key={idx}>{formatInline(it)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list items
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="my-1.5 ml-5 list-decimal space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
          {items.map((it, idx) => (
            <li key={idx}>{formatInline(it)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (!line.trim()) {
      blocks.push(<div key={`sp-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    blocks.push(
      <p key={i} className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
        {formatInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{blocks}</div>;
};
