import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "./auth";
import type { User } from "@/models/user";

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAuth(req: NextRequest): Promise<User> {
  const user = await getUserFromRequest(req);
  if (!user) throw new AuthError(401, "Unauthorized");
  return user;
}

export function requireRole(user: User, role: "admin" | "user") {
  if (user.role !== role) throw new AuthError(403, "Forbidden");
}

export function assertOwner(user: User, ownerId: number) {
  if (user.role === "admin") return;
  if (user.id !== ownerId) throw new AuthError(403, "Forbidden");
}

export function handleAuthz<T>(fn: () => Promise<T>) {
  return fn().catch((e) => {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  });
}
