import { NextRequest, NextResponse } from "next/server";
import { 
  getGoalWithActions,
  updateGoal,
  deleteGoal,
  getGoalById
} from "../../../../models/life";
import { requireAuth, assertOwner, handleAuthz } from "@/lib/authz";

/**
 * @swagger
 * /goals/{id}:
 *   get:
 *     summary: Get a goal by ID with its actions
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal with actions
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Goal'
 *                 - type: object
 *                   properties:
 *                     actions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Action'
 *       404:
 *         description: Goal not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const goal = await getGoalWithActions(parseInt(id));
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    assertOwner(authUser, goal.user_id as number);
    return NextResponse.json(goal);
  });
}

/**
 * @swagger
 * /goals/{id}:
 *   put:
 *     summary: Update a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [planned, active, blocked, done, dropped]
 *               target_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       404:
 *         description: Goal not found
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const existing = await getGoalById(parseInt(id));
    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    assertOwner(authUser, existing.user_id as number);
    const body = await req.json();
    const { title, description, status, target_date } = body;
    const updates: any = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status) {
      const validStatuses = ["planned", "active", "blocked", "done", "dropped"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = status;
    }
    if (target_date !== undefined) updates.target_date = target_date;
    const updatedGoal = await updateGoal(parseInt(id), updates);
    return NextResponse.json(updatedGoal);
  });
}

/**
 * @swagger
 * /goals/{id}:
 *   delete:
 *     summary: Delete a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Goal ID
 *     responses:
 *       204:
 *         description: Goal deleted successfully
 *       404:
 *         description: Goal not found
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const existing = await getGoalById(parseInt(id));
    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    assertOwner(authUser, existing.user_id as number);
    const deleted = await deleteGoal(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  });
}