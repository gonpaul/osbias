import { NextRequest, NextResponse } from "next/server";
import { 
  getFrameworkSteps,
  createFrameworkStep,
  getFrameworkById
} from "../../../../../models/knowledge";
import { requireAuth, assertOwner, requireRole, handleAuthz } from "@/lib/authz";

/**
 * @swagger
 * components:
 *   schemas:
 *     FrameworkStep:
 *       type: object
 *       required:
 *         - id
 *         - framework_id
 *         - step_order
 *         - title
 *       properties:
 *         id:
 *           type: integer
 *           description: Step ID
 *         framework_id:
 *           type: integer
 *           description: Framework ID
 *         step_order:
 *           type: integer
 *           description: Order of the step (starts from 1)
 *         title:
 *           type: string
 *           description: Step title
 *         description:
 *           type: string
 *           nullable: true
 *           description: Step description
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /frameworks/{id}/steps:
 *   get:
 *     summary: Get all steps for a framework
 *     tags: [Framework Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Framework ID
 *     responses:
 *       200:
 *         description: List of framework steps
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FrameworkStep'
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const frameworkId = parseInt(id);
    const framework = await getFrameworkById(frameworkId);
    if (!framework) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }
    if (!framework.is_system) {
      assertOwner(authUser, framework.user_id as number);
    }
    const steps = await getFrameworkSteps(frameworkId);
    return NextResponse.json(steps);
  });
}

/**
 * @swagger
 * /frameworks/{id}/steps:
 *   post:
 *     summary: Create a new step for a framework
 *     tags: [Framework Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Framework ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - step_order
 *               - title
 *             properties:
 *               step_order:
 *                 type: integer
 *                 minimum: 1
 *               title:
 *                 type: string
 *                 minLength: 1
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Step created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FrameworkStep'
 *       400:
 *         description: Bad request - missing required fields
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const frameworkId = parseInt(id);
    const framework = await getFrameworkById(frameworkId);
    if (!framework) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }
    if (framework.is_system) {
      requireRole(authUser, "admin");
    } else {
      assertOwner(authUser, framework.user_id as number);
    }
    const body = await req.json();
    const { step_order, title, description } = body;
    if (!step_order || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const newStep = await createFrameworkStep({
      framework_id: frameworkId,
      step_order,
      title,
      description: description || null
    });
    return NextResponse.json(newStep, { status: 201 });
  });
}
