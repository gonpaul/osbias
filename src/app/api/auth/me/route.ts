import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *       401:
 *         description: Not authenticated
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role, allow_posting: user.allow_posting });
}