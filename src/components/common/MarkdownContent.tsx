'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { useMemo } from 'react';
import Image from 'next/image';

export default function MarkdownContent({ content }: { content: string }) {
//   const schema = useMemo(() => {
//     const s = JSON.parse(JSON.stringify(defaultSchema)) as any;

//     const add = (obj: any, key: string, attrs: string[]) => {
//       const existing = obj[key] as string[] || [];
//       obj[key] = Array.from(new Set([...existing, ...attrs]));
//     };

//     s.attributes = s.attributes || {};

//     // allow classes for styling and highlighting
//     add(s.attributes, 'code', ['className']);
//     add(s.attributes, 'pre', ['className']);
//     add(s.attributes, 'table', ['className']);
//     add(s.attributes, 'td', ['className']);
//     add(s.attributes, 'th', ['className']);

//     // allow IDs and classes on headings for slugged anchors
//     add(s.attributes, 'h1', ['id', 'className']);
//     add(s.attributes, 'h2', ['id', 'className']);
//     add(s.attributes, 'h3', ['id', 'className']);
//     add(s.attributes, 'h4', ['id', 'className']);
//     add(s.attributes, 'h5', ['id', 'className']);
//     add(s.attributes, 'h6', ['id', 'className']);

//     // allow attributes used by rehype-autolink-headings
//     add(s.attributes, 'a', ['href', 'target', 'rel', 'aria-label', 'aria-hidden', 'className']);

//     // Allow images with src, alt, title, width, height attributes
//     if (!s.tagNames.includes('img')) s.tagNames.push('img');
//     add(s.attributes, 'img', ['src', 'alt', 'title', 'width', 'height', 'className']);

//     return s;
//   }, []);

  return (
    <div className="prose prose-invert max-w-full px-[1rem] overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'append' }],
          rehypeHighlight,
          [rehypeSanitize],
        //   [rehypeSanitize, schema],
        ]}
        components={{
          h1: ({ ...props }) => (
            <h1 {...props} className="text-3xl font-bold mt-12 mb-6" />
          ),
          h2: ({ ...props }) => (
            <h2 {...props} className="text-2xl font-semibold mt-10.5 mb-4.5" />
          ),
          h3: ({ ...props }) => (
            <h3 {...props} className="text-xl font-semibold mt-9 mb-4.5" />
          ),
          h4: ({ ...props }) => (
            <h4 {...props} className="text-lg font-semibold mt-7.5 mb-3" />
          ),
          h5: ({ ...props }) => (
            <h5 {...props} className="text-base font-semibold mt-6 mb-3" />
          ),
          h6: ({ ...props }) => (
            <h6 {...props} className="text-sm font-semibold mt-4.5 mb-3" />
          ),
          p: ({ ...props }) => (
            <p {...props} className="my-6 leading-loose tracking-normal" />
          ),
          ul: ({ ...props }) => (
            <ul {...props} className="list-disc pl-7 my-6 space-y-3" />
          ),
          ol: ({ ...props }) => (
            <ol {...props} className="list-decimal pl-7 my-6 space-y-3" />
          ),
          li: ({ ...props }) => (
            <li {...props} className="my-3" />
          ),
          a: ({ ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer noopener"
              className="text-(--golden) underline underline-offset-2 hover:opacity-80 transition-colors"
            />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              {...props}
              className="border-l-4 border-(--golden)/60 pl-6 py-3 italic text-(--foreground) my-9 bg-(--darkelbg) rounded-r"
            />
          ),
        //   img: ({ ...props }) => <img {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}


