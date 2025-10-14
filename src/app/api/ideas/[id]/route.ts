import { NextRequest, NextResponse } from "next/server";
import { getIdeaById, updateIdea, deleteIdea, getJournalEntryById } from "../../../../models/journal";
import { requireAuth, assertOwner, handleAuthz } from "@/lib/authz";

/**
 * @swagger
 * /ideas/{id}:
 *   get:
 *     summary: Get an idea by ID
 *     tags: [Ideas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Idea ID
 *     responses:
 *       200:
 *         description: Idea found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Idea'
 *       404:
 *         description: Idea not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const idea = await getIdeaById(parseInt(id));
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    // Ownership via parent journal entry
    const entry = await getJournalEntryById(idea.entry_id as number);
    if (!entry) {
      return NextResponse.json({ error: "Parent entry not found" }, { status: 404 });
    }
    assertOwner(authUser, entry.user_id as number);
    return NextResponse.json(idea);
  });
}

/**
 * @swagger
 * /ideas/{id}:
 *   put:
 *     summary: Update an idea
 *     tags: [Ideas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Idea ID
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
 *               content:
 *                 type: string
 *               text_selection:
 *                 type: string
 *                 nullable: true
 *               file_path:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Idea updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Idea'
 *       404:
 *         description: Idea not found
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const existing = await getIdeaById(parseInt(id));
    if (!existing) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    const entry = await getJournalEntryById(existing.entry_id as number);
    if (!entry) {
      return NextResponse.json({ error: "Parent entry not found" }, { status: 404 });
    }
    assertOwner(authUser, entry.user_id as number);
    const body: Partial<{ framework_id: number | null; content: string; text_selection: string | null; file_path: string | null }> = await req.json();
    const { framework_id, content, text_selection, file_path } = body;
    const updates: Partial<{ framework_id: number | null; content: string; text_selection: string | null; file_path: string | null }> = {};
    if (framework_id !== undefined) updates.framework_id = framework_id;
    if (content) updates.content = content;
    if (text_selection !== undefined) updates.text_selection = text_selection;
    if (file_path !== undefined) updates.file_path = file_path;
    const updatedIdea = await updateIdea(parseInt(id), updates);
    return NextResponse.json(updatedIdea);
  });
}

/**
 * @swagger
 * /ideas/{id}:
 *   delete:
 *     summary: Delete an idea
 *     tags: [Ideas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Idea ID
 *     responses:
 *       204:
 *         description: Idea deleted successfully
 *       404:
 *         description: Idea not found
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const existing = await getIdeaById(parseInt(id));
    if (!existing) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    const entry = await getJournalEntryById(existing.entry_id as number);
    if (!entry) {
      return NextResponse.json({ error: "Parent entry not found" }, { status: 404 });
    }
    assertOwner(authUser, entry.user_id as number);
    const deleted = await deleteIdea(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  });
}
