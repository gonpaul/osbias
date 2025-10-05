import { NextRequest, NextResponse } from "next/server";
import { requireAuth, assertOwner, handleAuthz } from "@/lib/authz";
import { 
  getValidationHistoryByUserId,
  createValidationHistory,
  searchValidationHistory,
  stringifyValidationResult,
  getValidationHistoryByFilePath,
  getValidationHistoryByEntryForUser
} from "../../../models/validation";

/**
 * @swagger
 * components:
 *   schemas:
 *     ValidationHistory:
 *       type: object
 *       required:
 *         - id
 *         - user_id
 *         - original_text
 *         - validation_result
 *       properties:
 *         id:
 *           type: integer
 *           description: Validation history ID
 *         user_id:
 *           type: integer
 *           description: User ID
 *         journal_entry_id:
 *           type: integer
 *           nullable: true
 *           description: Associated journal entry ID
 *         original_text:
 *           type: string
 *           description: Original text that was validated
 *         validation_result:
 *           type: string
 *           description: JSON string of validation result
 *         ai_provider:
 *           type: string
 *           nullable: true
 *           description: AI provider used
 *         ai_model:
 *           type: string
 *           nullable: true
 *           description: AI model used
 *         text_start:
 *           type: integer
 *           nullable: true
 *           description: Start position of selected text
 *         text_end:
 *           type: integer
 *           nullable: true
 *           description: End position of selected text
 *         is_full_document:
 *           type: boolean
 *           description: Whether entire document was validated
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateValidationHistoryRequest:
 *       type: object
 *       required:
 *         - original_text
 *         - validation_result
 *       properties:
 *         journal_entry_id:
 *           type: integer
 *           nullable: true
 *         original_text:
 *           type: string
 *           minLength: 1
 *         validation_result:
 *           type: object
 *           description: ValidationResult object
 *         ai_provider:
 *           type: string
 *           nullable: true
 *         ai_model:
 *           type: string
 *           nullable: true
 *         text_start:
 *           type: integer
 *           nullable: true
 *         text_end:
 *           type: integer
 *           nullable: true
 *         is_full_document:
 *           type: boolean
 *           default: false
 */

/**
 * @swagger
 * /validation-history:
 *   get:
 *     summary: Get validation history for a user
 *     tags: [Validation History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Admin may query any user_id; non-admins restricted to self
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search term to filter results
 *     responses:
 *       200:
 *         description: List of validation history entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ValidationHistory'
 */
export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const { searchParams } = new URL(req.url);
    const authUser = await requireAuth(req);
    const userIdParam = searchParams.get("user_id");
    const targetId = userIdParam ? parseInt(userIdParam) : authUser.id;
    assertOwner(authUser, targetId);
    
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const searchTerm = searchParams.get("search");
    const filePath = searchParams.get("file_path");
    const entryId = searchParams.get("entry_id");
    
    let history;
    if (entryId) {
      history = await getValidationHistoryByEntryForUser(targetId, parseInt(entryId), limit, offset);
    } else if (filePath) {
      history = await getValidationHistoryByFilePath(targetId, filePath, limit, offset);
    } else if (searchTerm) {
      history = await searchValidationHistory(targetId, searchTerm, limit, offset);
    } else {
      history = await getValidationHistoryByUserId(targetId, limit, offset);
    }
    
    return NextResponse.json(history);
  });
}

/**
 * @swagger
 * /validation-history:
 *   post:
 *     summary: Create a new validation history entry
 *     tags: [Validation History]
 *     security:
 *       - bearerAuth: []
 *     description: Non-admins can only create entries for themselves
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateValidationHistoryRequest'
 *     responses:
 *       201:
 *         description: Validation history entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationHistory'
 *       400:
 *         description: Bad request - missing required fields
 */
export async function POST(req: NextRequest) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const {
      journal_entry_id,
      original_text,
      validation_result,
      ai_provider,
      ai_model,
      text_start,
      text_end,
      is_full_document = false
    } = body;

    if (!original_text || !validation_result) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      const newEntry = await createValidationHistory({
        user_id: authUser.id,
        journal_entry_id,
        original_text,
        validation_result: stringifyValidationResult(validation_result),
        ai_provider,
        ai_model,
        text_start,
        text_end,
        is_full_document
      });

      return NextResponse.json(newEntry, { status: 201 });
    } catch (err: unknown) {
      console.error('Error creating validation history:', err);
      return NextResponse.json({ error: "Failed to create validation history" }, { status: 500 });
    }
  });
}
