import { NextRequest, NextResponse } from "next/server";
import { requireAuth, assertOwner, handleAuthz } from "@/lib/authz";
import { 
  getValidationHistoryById,
  deleteValidationHistory
} from "../../../../models/validation";

/**
 * @swagger
 * /validation-history/{id}:
 *   get:
 *     summary: Get a validation history entry by ID
 *     tags: [Validation History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Validation history ID
 *     responses:
 *       200:
 *         description: Validation history entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationHistory'
 *       404:
 *         description: Validation history entry not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const entry = await getValidationHistoryById(parseInt(id));
    
    if (!entry) {
      return NextResponse.json({ error: "Validation history entry not found" }, { status: 404 });
    }
    
    assertOwner(authUser, entry.user_id);
    return NextResponse.json(entry);
  });
}

/**
 * @swagger
 * /validation-history/{id}:
 *   delete:
 *     summary: Delete a validation history entry
 *     tags: [Validation History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Validation history ID
 *     responses:
 *       200:
 *         description: Validation history entry deleted successfully
 *       404:
 *         description: Validation history entry not found
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const entryId = parseInt(id);
    
    const entry = await getValidationHistoryById(entryId);
    if (!entry) {
      return NextResponse.json({ error: "Validation history entry not found" }, { status: 404 });
    }
    
    assertOwner(authUser, entry.user_id);
    
    const deleted = await deleteValidationHistory(entryId, authUser.id);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete validation history entry" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Validation history entry deleted successfully" });
  });
}
