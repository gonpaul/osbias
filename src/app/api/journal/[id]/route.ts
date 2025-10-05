import { NextRequest, NextResponse } from "next/server";
import { 
  getJournalEntryWithIdeas,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalEntryById
} from "../../../../models/journal";
import { requireAuth, assertOwner, handleAuthz } from "@/lib/authz";

/**
 * @swagger
 * /journal/{id}:
 *   get:
 *     summary: Get a journal entry by ID with its ideas
 *     tags: [Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Journal entry ID
 *     responses:
 *       200:
 *         description: Journal entry with ideas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/JournalEntry'
 *                 - type: object
 *                   properties:
 *                     ideas:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Idea'
 *       404:
 *         description: Journal entry not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const entryId = parseInt(id);
    const entry = await getJournalEntryWithIdeas(entryId);
    if (!entry) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }
    assertOwner(authUser, entry.user_id as number);
    return NextResponse.json(entry);
  });
}

/**
 * @swagger
 * /journal/{id}:
 *   put:
 *     summary: Update a journal entry
 *     tags: [Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Journal entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               framework_id:
 *                 type: integer
 *                 nullable: true
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Journal entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JournalEntry'
 *       404:
 *         description: Journal entry not found
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const entryId = parseInt(id);
    const existing = await getJournalEntryById(entryId);
    if (!existing) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }
    assertOwner(authUser, existing.user_id as number);
    const body = await req.json();
    const { framework_id, title, content, is_template, tags } = body as {
      framework_id?: number | null;
      title?: string;
      content?: string;
      is_template?: boolean;
      tags?: string[] | string | null;
    };
    const updates: Record<string, unknown> = {};
    if (framework_id !== undefined) updates.framework_id = framework_id;
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (typeof is_template === 'boolean') updates.is_template = is_template;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? JSON.stringify(tags) : (tags ?? null);
    const updatedEntry = await updateJournalEntry(entryId, updates);
    return NextResponse.json(updatedEntry);
  });
}

/**
 * @swagger
 * /journal/{id}:
 *   delete:
 *     summary: Delete a journal entry
 *     tags: [Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Journal entry ID
 *     responses:
 *       204:
 *         description: Journal entry deleted successfully
 *       404:
 *         description: Journal entry not found
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const entryId = parseInt(id);
    const existing = await getJournalEntryById(entryId);
    if (!existing) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }
    assertOwner(authUser, existing.user_id as number);
    const deleted = await deleteJournalEntry(entryId);
    if (!deleted) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  });
}