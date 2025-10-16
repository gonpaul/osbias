import { NextRequest, NextResponse } from "next/server";
import { 
  getActions,
  createAction,
  deleteAction,
  updateAction,
  type UpdateAction as UpdateActionType
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
  const { name, description = '', completed = false, due_date } = body;
  
  if (!name) {
    return NextResponse.json({ error: "Missing required field: description" }, { status: 400 });
  }
  
  const newAction = await createAction({
    goal_id: goalId,
    name,
    description,
    completed,
    due_date: due_date || null
  });
  
  return NextResponse.json(newAction, { status: 201 });
}

/**
 * @swagger
 * /goals/{id}/actions:
 *   put:
 *     summary: Update an action by ID for a goal
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Goal ID
 *       - in: query
 *         name: action_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               completed:
 *                 type: boolean
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Action updated successfully
 *       400:
 *         description: Missing action_id
 */
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const actionIdParam = searchParams.get("action_id");
  if (!actionIdParam) {
    return NextResponse.json({ error: "Missing action_id" }, { status: 400 });
  }
  const actionId = parseInt(actionIdParam);
  const body: Partial<UpdateActionType> = await req.json();
  const updated = await updateAction(actionId, body);
  return NextResponse.json(updated);
}

/**
 * @swagger
 * /goals/{id}/actions:
 *   delete:
 *     summary: Delete an action by ID for a goal
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Goal ID
 *       - in: query
 *         name: action_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Action ID to delete
 *     responses:
 *       204:
 *         description: Action deleted successfully
 *       400:
 *         description: Missing action_id
 *       404:
 *         description: Action not found
 */
export async function DELETE(
  req: NextRequest
) {
  const { searchParams } = new URL(req.url);
  const actionIdParam = searchParams.get("action_id");
  if (!actionIdParam) {
    return NextResponse.json({ error: "Missing action_id" }, { status: 400 });
  }
  const actionId = parseInt(actionIdParam);
  const deleted = await deleteAction(actionId);
  if (!deleted) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}