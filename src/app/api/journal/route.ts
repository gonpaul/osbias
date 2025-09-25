import { NextRequest, NextResponse } from "next/server";
import { requireAuth, assertOwner, handleAuthz } from "@/lib/authz";
import { 
  getJournalEntries,
  createJournalEntry
} from "../../../models/journal";

/**
 * @swagger
 * components:
 *   schemas:
 *     JournalEntry:
 *       type: object
 *       required:
 *         - id
 *         - user_id
 *         - title
 *         - content
 *       properties:
 *         id:
 *           type: integer
 *           description: Entry ID
 *         user_id:
 *           type: integer
 *           description: User ID
 *         framework_id:
 *           type: integer
 *           nullable: true
 *           description: Associated framework ID
 *         title:
 *           type: string
 *           description: Entry title
 *         content:
 *           type: string
 *           description: Entry content
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateJournalEntryRequest:
 *       type: object
 *       required:
 *         - user_id
 *         - title
 *         - content
 *       properties:
 *         user_id:
 *           type: integer
 *         framework_id:
 *           type: integer
 *           nullable: true
 *         title:
 *           type: string
 *           minLength: 1
 *         content:
 *           type: string
 *           minLength: 1
 */

/**
 * @swagger
 * /journal:
 *   get:
 *     summary: Get journal entries for a user
 *     tags: [Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Admin may query any user_id; non-admins restricted to self
 *     responses:
 *       200:
 *         description: List of journal entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/JournalEntry'
 */
export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("user_id");
    const authUser = await requireAuth(req);
    const targetId = userIdParam ? parseInt(userIdParam) : authUser.id;
    assertOwner(authUser, targetId);
    const entries = await getJournalEntries(targetId);
    return NextResponse.json(entries);
  });
}

/**
 * @swagger
 * /journal:
 *   post:
 *     summary: Create a new journal entry
 *     tags: [Journal]
 *     security:
 *       - bearerAuth: []
 *     description: Non-admins can only create entries for themselves
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJournalEntryRequest'
 *     responses:
 *       201:
 *         description: Journal entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JournalEntry'
 *       400:
 *         description: Bad request - missing required fields
 */
export async function POST(req: NextRequest) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const { user_id, framework_id, title, content } = body;

    const ownerId = user_id ?? authUser.id;
    assertOwner(authUser, ownerId);
    if (!ownerId || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newEntry = await createJournalEntry({
      user_id: ownerId,
      framework_id: framework_id || null,
      title,
      content
    });
    
    return NextResponse.json(newEntry, { status: 201 });
  });
}