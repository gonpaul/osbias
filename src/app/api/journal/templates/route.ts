import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleAuthz } from '@/lib/authz';
import { getJournalEntries } from '@/models/journal';

export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const tag = url.searchParams.get('tag') || '';
    const includeAll = url.searchParams.get('include_all') === 'true';

    try {
      // Get all entries for the user
      const allEntries = await getJournalEntries(authUser.id);
      
      // Filter to only templates
      let templates = allEntries.filter(entry => entry.is_template);
      
      // If include_all=true and user is admin, get all templates
      // Otherwise, get only user's templates
      if (includeAll && authUser.role === 'admin') {
        // For admin, we'd need to get all templates from all users
        // For now, just return user's templates
        templates = allEntries.filter(entry => entry.is_template);
      }
      
      // Apply search filter if provided
      if (q) {
        templates = templates.filter(entry => 
          entry.title.toLowerCase().includes(q.toLowerCase()) ||
          entry.content.toLowerCase().includes(q.toLowerCase())
        );
      }
      
      // Apply tag filter if provided
      if (tag) {
        templates = templates.filter(entry => {
          if (!entry.tags) return false;
          try {
            const tags = JSON.parse(entry.tags);
            return Array.isArray(tags) && tags.includes(tag);
          } catch {
            return false;
          }
        });
      }

      return NextResponse.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }
  });
}
