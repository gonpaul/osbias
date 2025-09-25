import { NextRequest, NextResponse } from "next/server";
import { requireAuth, assertOwner, handleAuthz } from "@/lib/authz";
import { 
  getGoals,
  createGoal
} from "../../../models/life";

/**
 * @swagger
 * components:
 *   schemas:
 *     Goal:
 *       type: object
 *       required:
 *         - id
 *         - user_id
 *         - title
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *           description: Goal ID
 *         user_id:
 *           type: integer
 *           description: User ID
 *         title:
 *           type: string
 *           description: Goal title
 *         description:
 *           type: string
 *           nullable: true
 *           description: Goal description
 *         status:
 *           type: string
 *           enum: [planned, active, blocked, done, dropped]
 *           description: Goal status
 *         target_date:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Target completion date
 *         created_at:
 *           type: string
 *           format: date-time
 *     CreateGoalRequest:
 *       type: object
 *       required:
 *         - user_id
 *         - title
 *         - status
 *       properties:
 *         user_id:
 *           type: integer
 *         title:
 *           type: string
 *           minLength: 1
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [planned, active, blocked, done, dropped]
 *           default: planned
 *         target_date:
 *           type: string
 *           format: date
 */

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: Get goals for a user
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Admin may query any user_id; non-admins restricted to self
 *     responses:
 *       200:
 *         description: List of goals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Goal'
 */
export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("user_id");
    const authUser = await requireAuth(req);
    const targetId = userIdParam ? parseInt(userIdParam) : authUser.id;
    assertOwner(authUser, targetId);
    const goals = await getGoals(targetId);
    return NextResponse.json(goals);
  });
}

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     description: Non-admins can only create goals for themselves
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGoalRequest'
 *     responses:
 *       201:
 *         description: Goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       400:
 *         description: Bad request - missing required fields
 */
export async function POST(req: NextRequest) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const { user_id, title, description, status = "planned", target_date } = body;

    const ownerId = user_id ?? authUser.id;
    assertOwner(authUser, ownerId);

    if (!ownerId || !title || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const validStatuses = ["planned", "active", "blocked", "done", "dropped"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    
    const newGoal = await createGoal({
      user_id: ownerId,
      title,
      description: description || null,
      status,
      target_date: target_date || null
    });
    
    return NextResponse.json(newGoal, { status: 201 });
  });
}