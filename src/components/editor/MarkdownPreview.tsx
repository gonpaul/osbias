'use client';

import MarkdownContent from '@/components/common/MarkdownContent';

type Props = {
  content: string;
};

export default function MarkdownPreview({ content }: Props) {
  return <MarkdownContent content={content || ''} />;
}


