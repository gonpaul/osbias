import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthz } from "@/lib/authz";
import { 
  getFrameworkSteps, 
  createFrameworkStep, 
  getFrameworkById 
} from "@/models/knowledge";

/**
 * @swagger
 * /frameworks/{id}/steps:
 *   get:
 *     summary: Get steps for a specific framework
 *     tags: [Frameworks]
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
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   framework_id:
 *                     type: integer
 *                   step_order:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Framework not found
 *       401:
 *         description: Unauthorized
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    await requireAuth(req);
    const { id } = await params;
    const frameworkId = parseInt(id);
    
    if (isNaN(frameworkId)) {
      return NextResponse.json(
        { error: "Invalid framework ID" },
        { status: 400 }
      );
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
 *     tags: [Frameworks]
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
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Framework step created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 framework_id:
 *                   type: integer
 *                 step_order:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner of framework
 *       404:
 *         description: Framework not found
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const frameworkId = parseInt(id);
    
    if (isNaN(frameworkId)) {
      return NextResponse.json(
        { error: "Invalid framework ID" },
        { status: 400 }
      );
    }

    // Check if framework exists and user has permission
    const framework = await getFrameworkById(frameworkId);
    if (!framework) {
      return NextResponse.json(
        { error: "Framework not found" },
        { status: 404 }
      );
    }

    // Only allow editing if user owns the framework, it's a system framework, or user is admin
    if (!framework.is_system && framework.user_id !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - not owner of framework" },
        { status: 403 }
      );
    }

    const body: Partial<{ step_order: number; title: string; description: string | null }> = await req.json();
    const { step_order, title, description } = body;

    if (!step_order || !title) {
      return NextResponse.json(
        { error: "Missing required fields: step_order and title" },
        { status: 400 }
      );
    }

    if (step_order < 1) {
      return NextResponse.json(
        { error: "step_order must be >= 1" },
        { status: 400 }
      );
    }

    try {
      const newStep = await createFrameworkStep({
        framework_id: frameworkId,
        step_order,
        title,
        description: description || null,
      });

      return NextResponse.json(newStep, { status: 201 });
    } catch (err: unknown) {
      const anyErr = err as { message?: string; code?: string } | undefined;
      const msg = String(anyErr?.message || "");
      const code = String(anyErr?.code || "");
      if (code.includes("SQLITE_CONSTRAINT") || msg.toUpperCase().includes("UNIQUE") || msg.toUpperCase().includes("CONSTRAINT")) {
        return NextResponse.json({ error: "Step order already exists for this framework" }, { status: 409 });
      }
      throw err;
    }
  });
}