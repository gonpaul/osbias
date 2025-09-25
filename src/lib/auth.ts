import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import db from "../lib/db";
import type { User } from "../models/user";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const TOKEN_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { id: number; email: string; role: 'user' | 'admin' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SEC });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: 'user' | 'admin' };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest) {
  const cookie = req.cookies.get("auth_token")?.value || null;
  const authHeader = req.headers.get("authorization") || "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return cookie || (m ? m[1] : null);
}

export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await db<User>("users").where({ id: payload.id }).first();
  return user || null;
}