import { NextRequest, NextResponse } from "next/server";
import { getBeliefById, updateBelief, deleteBelief } from "../../../../models/life";
import type { UpdateBelief } from "../../../../models/life";
import { requireAuth, assertOwner, handleAuthz } from "@/lib/authz";

/**
 * @swagger
 * /beliefs/{id}:
 *   get:
 *     summary: Get a belief by ID
 *     tags: [Beliefs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Belief ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Belief found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Belief'
 *       404:
 *         description: Belief not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const belief = await getBeliefById(parseInt(id));
    if (!belief) {
      return NextResponse.json({ error: "Belief not found" }, { status: 404 });
    }
    assertOwner(authUser, belief.user_id as number);
    return NextResponse.json(belief);
  });
}

/**
 * @swagger
 * /beliefs/{id}:
 *   put:
 *     summary: Update a belief
 *     tags: [Beliefs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Belief ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               belief:
 *                 type: string
 *               confidence_level:
 *                 type: number
 *                 format: float
 *               evidence:
 *                 type: string
 *     responses:
 *       200:
 *         description: Belief updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Belief'
 *       404:
 *         description: Belief not found
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const body: Partial<{ belief: string; confidence_level: number; evidence: string | null }> = await req.json();
    const { belief, confidence_level, evidence } = body;

    const existing = await getBeliefById(parseInt(id));
    if (!existing) {
      return NextResponse.json({ error: "Belief not found" }, { status: 404 });
    }
    assertOwner(authUser, existing.user_id as number);

    const updates: Partial<UpdateBelief> = {};
    if (belief) updates.belief = belief;
    if (confidence_level !== undefined) updates.confidence_level = confidence_level;
    if (evidence !== undefined) updates.evidence = evidence;

    const updatedBelief = await updateBelief(parseInt(id), updates);
    return NextResponse.json(updatedBelief);
  });
}

/**
 * @swagger
 * /beliefs/{id}:
 *   delete:
 *     summary: Delete a belief
 *     tags: [Beliefs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Belief ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Belief deleted successfully
 *       404:
 *         description: Belief not found
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const existing = await getBeliefById(parseInt(id));
    if (!existing) {
      return NextResponse.json({ error: "Belief not found" }, { status: 404 });
    }
    assertOwner(authUser, existing.user_id as number);
    const deleted = await deleteBelief(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ error: "Belief not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  });
}
