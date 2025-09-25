import { NextRequest, NextResponse } from "next/server";
import { 
  getIdeas,
  createIdea
} from "../../../../../models/journal";

/**
 * @swagger
 * components:
 *   schemas:
 *     Idea:
 *       type: object
 *       required:
 *         - id
 *         - entry_id
 *         - content
 *       properties:
 *         id:
 *           type: integer
 *           description: Idea ID
 *         entry_id:
 *           type: integer
 *           description: Journal entry ID
 *         framework_id:
 *           type: integer
 *           nullable: true
 *           description: Associated framework ID
 *         content:
 *           type: string
 *           description: Idea content
 *         text_selection:
 *           type: string
 *           nullable: true
 *           description: Selected text that inspired the idea
 *         file_path:
 *           type: string
 *           nullable: true
 *           description: File path if idea relates to a file
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /journal/{id}/ideas:
 *   get:
 *     summary: Get all ideas for a journal entry
 *     tags: [Ideas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Journal entry ID
 *     responses:
 *       200:
 *         description: List of ideas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Idea'
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entryId = parseInt(id);
  const ideas = await getIdeas(entryId);
  return NextResponse.json(ideas);
}

/**
 * @swagger
 * /journal/{id}/ideas:
 *   post:
 *     summary: Create a new idea for a journal entry
 *     tags: [Ideas]
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
 *             required:
 *               - content
 *             properties:
 *               framework_id:
 *                 type: integer
 *                 nullable: true
 *               content:
 *                 type: string
 *                 minLength: 1
 *               text_selection:
 *                 type: string
 *               file_path:
 *                 type: string
 *     responses:
 *       201:
 *         description: Idea created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Idea'
 *       400:
 *         description: Bad request - missing required fields
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entryId = parseInt(id);
  const body = await req.json();
  const { framework_id, content, text_selection, file_path } = body;
  
  if (!content) {
    return NextResponse.json({ error: "Missing required field: content" }, { status: 400 });
  }
  
  const newIdea = await createIdea({
    entry_id: entryId,
    framework_id: framework_id || null,
    content,
    text_selection: text_selection || null,
    file_path: file_path || null
  });
  
  return NextResponse.json(newIdea, { status: 201 });
}