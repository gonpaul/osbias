import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser, deleteUser } from "../../../../models/user";
import { requireAuth, assertOwner, requireRole, handleAuthz } from "@/lib/authz";

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const user = await getUserById(parseInt(id));
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    assertOwner(authUser, user.id as number);
    return NextResponse.json(user);
  });
}

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const target = await getUserById(parseInt(id));
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const body = await req.json();

    // Admin can update management fields; users can update name/email for self only
    const updates: Record<string, unknown> = {};
    if (authUser.role === 'admin') {
      if (typeof body.role === 'string' && (body.role === 'user' || body.role === 'admin')) updates.role = body.role;
      if (typeof body.is_test_user === 'boolean') updates.is_test_user = body.is_test_user;
      if (typeof body.rate_limit_quota === 'number' || body.rate_limit_quota === null) updates.rate_limit_quota = body.rate_limit_quota ?? null;
      if (typeof body.exempt_from_rate_limit === 'boolean') updates.exempt_from_rate_limit = body.exempt_from_rate_limit;
      if (typeof body.plan === 'string' || body.plan === null) updates.plan = body.plan ?? null;
      if (typeof body.openai_api_key === 'string' || body.openai_api_key === null) updates.openai_api_key = body.openai_api_key ?? null;
      if (typeof body.anthropic_api_key === 'string' || body.anthropic_api_key === null) updates.anthropic_api_key = body.anthropic_api_key ?? null;
      if (typeof body.allow_posting === 'boolean') updates.allow_posting = body.allow_posting;
      if (typeof body.name === 'string') updates.name = body.name;
      if (typeof body.email === 'string') updates.email = body.email;
    } else {
      // Non-admins: only self and only name/email
      assertOwner(authUser, target.id as number);
      if (typeof body.name === 'string') updates.name = body.name;
      if (typeof body.email === 'string') updates.email = body.email;
    }

    // Optional admin action: reset quota
    if (authUser.role === 'admin' && body && body.action === 'reset_quota') {
      const { resetUserQuota } = await import('@/lib/rateLimit');
      await resetUserQuota(target.id as number);
    }

    const updatedUser = await updateUser(parseInt(id), updates);
    return NextResponse.json(updatedUser);
  });
}

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    requireRole(authUser, "admin");
    const { id } = await params;
    const deleted = await deleteUser(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  });
}
