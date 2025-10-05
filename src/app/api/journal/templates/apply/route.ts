import { NextRequest, NextResponse } from "next/server";
import { requireAuth, assertOwner, handleAuthz } from "@/lib/authz";
import { getJournalEntryById, createJournalEntry } from "@/models/journal";

/**
 * @swagger
 * /journal/templates/apply:
 *   post:
 *     summary: Create a new journal entry from a template entry
 *     tags: [Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [template_id]
 *             properties:
 *               template_id:
 *                 type: integer
 *               title_override:
 *                 type: string
 *               framework_id:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Entry created
 */
export async function POST(req: NextRequest) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const { template_id, title_override, framework_id } = body;

    if (!template_id) {
      return NextResponse.json({ error: "template_id is required" }, { status: 400 });
    }

    const template = await getJournalEntryById(parseInt(String(template_id)));
    if (!template || !template.is_template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Create a new entry for the current user using the template content
    const created = await createJournalEntry({
      user_id: authUser.id,
      framework_id: framework_id ?? null,
      title: title_override || template.title || 'Untitled',
      content: template.content || '',
      is_template: false,
      tags: null,
    } as any);

    return NextResponse.json(created, { status: 201 });
  });
}


