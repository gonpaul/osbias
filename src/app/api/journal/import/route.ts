import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const content = await file.text();
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    let entries: Array<{ title: string; content: string }> = [];

    if (fileExtension === 'md') {
      // Parse markdown file
      entries = parseMarkdownFile(content);
    } else if (fileExtension === 'txt') {
      // Parse text file
      entries = parseTextFile(content);
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

    // Create journal entries
    const createdEntries = [];
    for (const entry of entries) {
      const [insertedEntry] = await db('journal_entries')
        .insert({
          user_id: user.id,
          title: entry.title,
          content: entry.content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .returning('*');
      
      createdEntries.push(insertedEntry);
    }

    return NextResponse.json({ 
      message: 'Import successful', 
      count: createdEntries.length,
      entries: createdEntries.map(e => ({ id: e.id, title: e.title }))
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}

function parseMarkdownFile(content: string): Array<{ title: string; content: string }> {
  const entries: Array<{ title: string; content: string }> = [];
  
  // Split by markdown headers (lines starting with #)
  const sections = content.split(/^# /m).filter(section => section.trim());
  
  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    
    if (title && content) {
      entries.push({ title, content });
    }
  }
  
  return entries;
}

function parseTextFile(content: string): Array<{ title: string; content: string }> {
  const entries: Array<{ title: string; content: string }> = [];
  
  // Split by double newlines or separator lines
  const sections = content.split(/\n\s*\n/).filter(section => section.trim());
  
  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    
    if (title && content) {
      entries.push({ title, content });
    }
  }
  
  return entries;
}
