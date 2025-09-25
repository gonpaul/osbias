import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import type { User } from "@/models/user";

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Logged in }
 *       401: { description: Invalid credentials }
 */
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await db<User>("users").where({ email }).first();
  if (!user) return NextResponse.json({ error: "Invalid" }, { status: 401 });

  const ok = await verifyPassword(password, user.password_hash || "");
  if (!ok) return NextResponse.json({ error: "Invalid" }, { status: 401 });

  const token = signToken({ id: user.id, email: user.email, role: user.role as any });
  const res = NextResponse.json(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    { status: 200 }
  );
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
