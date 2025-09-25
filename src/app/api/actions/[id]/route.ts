import { NextRequest, NextResponse } from "next/server";
import { getActionById, updateAction, deleteAction } from "../../../../models/life";

/**
 * @swagger
 * /actions/{id}:
 *   get:
 *     summary: Get an action by ID
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Action ID
 *     responses:
 *       200:
 *         description: Action found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Action'
 *       404:
 *         description: Action not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const action = await getActionById(parseInt(id));
  
  if (!action) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }
  
  return NextResponse.json(action);
}

/**
 * @swagger
 * /actions/{id}:
 *   put:
 *     summary: Update an action
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Action ID
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Action'
 *       404:
 *         description: Action not found
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { description, completed, due_date } = body;
  
  const updates: any = {};
  if (description) updates.description = description;
  if (completed !== undefined) updates.completed = completed;
  if (due_date !== undefined) updates.due_date = due_date;
  
  const updatedAction = await updateAction(parseInt(id), updates);
  
  if (!updatedAction) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }
  
  return NextResponse.json(updatedAction);
}

/**
 * @swagger
 * /actions/{id}:
 *   delete:
 *     summary: Delete an action
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Action ID
 *     responses:
 *       204:
 *         description: Action deleted successfully
 *       404:
 *         description: Action not found
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteAction(parseInt(id));
  
  if (!deleted) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }
  
  return new NextResponse(null, { status: 204 });
}
