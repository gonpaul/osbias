import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthz } from "@/lib/authz";
import { getFrameworkUsageStats } from "@/models/knowledge";

/**
 * @swagger
 * /frameworks/{id}/stats:
 *   get:
 *     summary: Get usage statistics for a specific framework
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
 *     responses:
 *       200:
 *         description: Framework usage statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_uses:
 *                   type: integer
 *                 unique_users:
 *                   type: integer
 *                 completion_rate:
 *                   type: number
 *                 avg_rating:
 *                   type: number
 *       404:
 *         description: Framework not found
 *       401:
 *         description: Unauthorized
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    await requireAuth(req);
    const { id } = await params;
    const frameworkId = parseInt(id);
    
    if (isNaN(frameworkId)) {
      return NextResponse.json(
        { error: "Invalid framework ID" },
        { status: 400 }
      );
    }

    const stats = await getFrameworkUsageStats(frameworkId);
    return NextResponse.json(stats);
  });
}
