import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { User } from "@/models/user";
import { getUserFromRequest } from "@/lib/auth";

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}

export async function PUT(req: NextRequest) {
  const authUser = await getUserFromRequest(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, openai_api_key, anthropic_api_key } = await req.json();
  const updates: Partial<User> = {};
  if (name) updates.name = name;
  if (email) {
    const exists = await db<User>("users").where({ email }).andWhereNot({ id: authUser.id }).first();
    if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    updates.email = email;
  }
  if (typeof openai_api_key === 'string' || openai_api_key === null) {
    updates.openai_api_key = openai_api_key ?? null;
  }
  if (typeof anthropic_api_key === 'string' || anthropic_api_key === null) {
    updates.anthropic_api_key = anthropic_api_key ?? null;
  }
  await db<User>("users").where({ id: authUser.id }).update(updates);
  const updated = await db<User>("users").where({ id: authUser.id }).first();
  return NextResponse.json({ id: updated!.id, name: updated!.name, email: updated!.email, hasOpenAIKey: !!updated!.openai_api_key, hasAnthropicKey: !!updated!.anthropic_api_key });
}