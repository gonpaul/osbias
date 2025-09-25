import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { User } from "@/models/user";
import { getUserFromRequest, verifyPassword, hashPassword } from "@/lib/auth";

/**
 * @swagger
 * /users/me/password:
 *   put:
 *     summary: Change password
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 */
export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { oldPassword, newPassword } = await req.json();
  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const ok = await verifyPassword(oldPassword, user.password_hash || "");
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const newHash = await hashPassword(newPassword);
  await db<User>("users").where({ id: user.id }).update({ password_hash: newHash });
  return new NextResponse(null, { status: 204 });
}
