import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthz } from "@/lib/authz";
import { createFrameworkUsage } from "@/models/knowledge";

/**
 * @swagger
 * /frameworks/{id}/use:
 *   post:
 *     summary: Track framework usage
 *     tags: [Frameworks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Framework ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entry_id:
 *                 type: integer
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *               completed:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Framework usage tracked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const frameworkId = parseInt(id);
    
    if (isNaN(frameworkId)) {
      return NextResponse.json(
        { error: "Invalid framework ID" },
        { status: 400 }
      );
    }

    let body: Partial<{ entry_id: number | null; notes: string | null; completed: boolean }> = {};
    try {
      body = await req.json();
    } catch {}
    const { entry_id, notes, completed = false } = body;

    const usage = await createFrameworkUsage({
      user_id: authUser.id,
      framework_id: frameworkId,
      entry_id: entry_id || null,
      notes: notes || null,
      completed,
      used_at: new Date().toISOString(),
    });

    return NextResponse.json(usage, { status: 201 });
  });
}
