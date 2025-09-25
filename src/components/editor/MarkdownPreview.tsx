'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';

// highlight.js styles can also be imported globally; we import here locally
import 'highlight.js/styles/github-dark.css';

type Props = {
  content: string;
};

export default function MarkdownPreview({ content }: Props) {
  const schema = useMemo(() => {
    const s: any = JSON.parse(JSON.stringify(defaultSchema));

    const add = (obj: any, key: string, attrs: string[]) => {
      obj[key] = Array.from(new Set([...(obj[key] || []), ...attrs]));
    };

    s.attributes = s.attributes || {};

    // allow classes for styling and highlighting
    add(s.attributes, 'code', ['className']);
    add(s.attributes, 'pre', ['className']);
    add(s.attributes, 'table', ['className']);
    add(s.attributes, 'td', ['className']);
    add(s.attributes, 'th', ['className']);

    // allow IDs and classes on headings for slugged anchors
    add(s.attributes, 'h1', ['id', 'className']);
    add(s.attributes, 'h2', ['id', 'className']);
    add(s.attributes, 'h3', ['id', 'className']);
    add(s.attributes, 'h4', ['id', 'className']);
    add(s.attributes, 'h5', ['id', 'className']);
    add(s.attributes, 'h6', ['id', 'className']);

    // allow attributes used by rehype-autolink-headings
    add(s.attributes, 'a', ['href', 'target', 'rel', 'aria-label', 'aria-hidden', 'className']);

    // Optionally allow images later
    // if (!s.tagNames.includes('img')) s.tagNames.push('img');
    // add(s.attributes, 'img', ['src', 'alt']);

    return s;
  }, []);

  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'append' }],
          rehypeHighlight,
          [rehypeSanitize, schema],
        ]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 {...props} className="text-3xl font-bold mt-6 mb-3" />
          ),
          h2: ({ node, ...props }) => (
            <h2 {...props} className="text-2xl font-semibold mt-5 mb-2" />
          ),
          h3: ({ node, ...props }) => (
            <h3 {...props} className="text-xl font-semibold mt-4 mb-2" />
          ),
          h4: ({ node, ...props }) => (
            <h4 {...props} className="text-lg font-semibold mt-3 mb-1" />
          ),
          h5: ({ node, ...props }) => (
            <h5 {...props} className="text-base font-semibold mt-2 mb-1" />
          ),
          h6: ({ node, ...props }) => (
            <h6 {...props} className="text-sm font-semibold mt-2 mb-1" />
          ),
          p: ({ node, ...props }) => (
            <p {...props} className="my-2 leading-relaxed" />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc pl-6 my-2" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal pl-6 my-2" />
          ),
          li: ({ node, ...props }) => (
            <li {...props} className="my-1" />
          ),
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-400 underline hover:text-blue-300 transition-colors"
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              {...props}
              className="border-l-4 border-blue-400 pl-4 italic text-(--foreground) my-4 tracking-wider"
            />
          ),
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}


