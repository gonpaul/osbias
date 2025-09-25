import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { User } from "@/models/user";
import { getUserFromRequest } from "@/lib/auth";

/**
 * @swagger
 * /users/me/preferences:
 *   get:
 *     summary: Get preferences
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *   put:
 *     summary: Update preferences
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prefs = user.preferences ? JSON.parse(user.preferences as any) : {};
  return NextResponse.json(prefs);
}

export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json(); // any JSON
  await db<User>("users").where({ id: user.id }).update({ preferences: JSON.stringify(body) });
  return NextResponse.json(body);
}
