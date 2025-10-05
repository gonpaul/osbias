import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all journal entries for the user
    const entries = await db('journal_entries')
      .where('user_id', user.id)
      .orderBy('created_at', 'desc');
    const typedEntries = entries as Array<{
      title: string;
      content: string;
      created_at: string | number | Date;
    }>;

    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'md';
    const ext = (url.searchParams.get('ext') || 'md').toLowerCase();

    if (format === 'zip') {
      // Export each entry as its own file inside a ZIP
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      const sanitize = (s: string) => s.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
      const fileExt = ext === 'txt' ? 'txt' : 'md';

      for (const entry of typedEntries) {
        const filename = `${sanitize(entry.title || 'untitled')}.${fileExt}`;
        // For md files, prepend created_at timestamp as a non-rendering comment
        const createdISO = new Date(entry.created_at).toISOString();
        const original = entry.content || '';
        const fileContent = fileExt === 'md'
          ? `<!-- created_at: ${createdISO} -->\n${original}`
          : original;
        zip.file(filename, fileContent);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="journal_entries_${new Date().toISOString().split('T')[0]}.zip"`
        }
      });
    } else if (format === 'txt') {
      // Export as plain text
      const content = typedEntries.map(entry => {
        const date = new Date(entry.created_at).toLocaleDateString();
        return `${entry.title}\n${'='.repeat(entry.title.length)}\n\nDate: ${date}\n\n${entry.content}\n\n${'='.repeat(50)}\n\n`;
      }).join('');

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="journal_entries_${new Date().toISOString().split('T')[0]}.txt"`
        }
      });
    } else {
      // Export as markdown
      const content = typedEntries.map(entry => {
        const date = new Date(entry.created_at).toLocaleDateString();
        return `# ${entry.title}\n\n**Date:** ${date}\n\n${entry.content}\n\n---\n\n`;
      }).join('');

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="journal_entries_${new Date().toISOString().split('T')[0]}.md"`
        }
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
