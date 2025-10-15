import { NextRequest, NextResponse } from "next/server";
import { handleAuthz, requireAuth, requireRole } from "@/lib/authz";
import db from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const user = await requireAuth(req);
    requireRole(user, "admin");
    const { id } = await params;
    const pid = parseInt(id);
    const body = await req.json();

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title;
    if (typeof body.content === "string") updates.content = body.content;
    if (typeof body.visibility === "string" && ["public", "unlisted", "private"].includes(body.visibility)) updates.visibility = body.visibility;
    if (typeof body.slug === "string") updates.slug = body.slug;
    if (typeof body.author_id === "number") updates.author_id = body.author_id;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await db("posts").where({ id: pid }).update(updates).returning("*");
    const row = Array.isArray(updated) ? updated[0] : null;
    if (!row) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json(row);
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const user = await requireAuth(req);
    requireRole(user, "admin");
    const { id } = await params;
    const pid = parseInt(id);
    const deleted = await db("posts").where({ id: pid }).del();
    if (!deleted) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  });
}


