import { NextRequest, NextResponse } from "next/server";
import { 
  getActions,
  createAction
} from "../../../../../models/life";

/**
 * @swagger
 * components:
 *   schemas:
 *     Action:
 *       type: object
 *       required:
 *         - id
 *         - goal_id
 *         - description
 *         - completed
 *       properties:
 *         id:
 *           type: integer
 *           description: Action ID
 *         goal_id:
 *           type: integer
 *           description: Goal ID
 *         description:
 *           type: string
 *           description: Action description
 *         completed:
 *           type: boolean
 *           description: Whether the action is completed
 *         due_date:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Action due date
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /goals/{id}/actions:
 *   get:
 *     summary: Get all actions for a goal
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: List of actions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Action'
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const goalId = parseInt(id);
  const actions = await getActions(goalId);
  return NextResponse.json(actions);
}

/**
 * @swagger
 * /goals/{id}/actions:
 *   post:
 *     summary: Create a new action for a goal
 *     tags: [Actions]
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
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 minLength: 1
 *               completed:
 *                 type: boolean
 *                 default: false
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Action created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Action'
 *       400:
 *         description: Bad request - missing required fields
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const goalId = parseInt(id);
  const body = await req.json();
  const { description, completed = false, due_date } = body;
  
  if (!description) {
    return NextResponse.json({ error: "Missing required field: description" }, { status: 400 });
  }
  
  const newAction = await createAction({
    goal_id: goalId,
    description,
    completed,
    due_date: due_date || null
  });
  
  return NextResponse.json(newAction, { status: 201 });
}