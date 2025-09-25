import { NextResponse } from "next/server";

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       204: { description: Logged out }
 */
export async function POST() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
  return res;
}
