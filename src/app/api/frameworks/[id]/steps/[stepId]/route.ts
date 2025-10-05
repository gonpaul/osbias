import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthz } from "@/lib/authz";
import { 
  getFrameworkStepById,
  updateFrameworkStep, 
  deleteFrameworkStep,
  getFrameworkById 
} from "@/models/knowledge";

/**
 * @swagger
 * /frameworks/{id}/steps/{stepId}:
 *   put:
 *     summary: Update a framework step
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
 *       - in: path
 *         name: stepId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Step ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Framework step updated successfully
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
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner of framework
 *       404:
 *         description: Framework or step not found
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const frameworkId = parseInt(params.id);
    const stepId = parseInt(params.stepId);
    
    if (isNaN(frameworkId) || isNaN(stepId)) {
      return NextResponse.json(
        { error: "Invalid framework ID or step ID" },
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

    // Check if step exists
    const existingStep = await getFrameworkStepById(stepId);
    if (!existingStep || existingStep.framework_id !== frameworkId) {
      return NextResponse.json(
        { error: "Framework step not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { step_order, title, description } = body;

    if (step_order !== undefined && step_order < 1) {
      return NextResponse.json(
        { error: "step_order must be >= 1" },
        { status: 400 }
      );
    }

    try {
      const updatedStep = await updateFrameworkStep(stepId, {
        ...(step_order !== undefined && { step_order }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      });

      if (!updatedStep) {
        return NextResponse.json(
          { error: "Failed to update framework step" },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedStep);
    } catch (err: any) {
      const msg = String(err?.message || "");
      const code = String((err && (err as any).code) || "");
      if (code.includes("SQLITE_CONSTRAINT") || msg.toUpperCase().includes("UNIQUE") || msg.toUpperCase().includes("CONSTRAINT")) {
        return NextResponse.json({ error: "Step order already exists for this framework" }, { status: 409 });
      }
      throw err;
    }
  });
}

/**
 * @swagger
 * /frameworks/{id}/steps/{stepId}:
 *   delete:
 *     summary: Delete a framework step
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
 *       - in: path
 *         name: stepId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Step ID
 *     responses:
 *       200:
 *         description: Framework step deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner of framework
 *       404:
 *         description: Framework or step not found
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const frameworkId = parseInt(params.id);
    const stepId = parseInt(params.stepId);
    
    if (isNaN(frameworkId) || isNaN(stepId)) {
      return NextResponse.json(
        { error: "Invalid framework ID or step ID" },
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

    // Check if step exists
    const existingStep = await getFrameworkStepById(stepId);
    if (!existingStep || existingStep.framework_id !== frameworkId) {
      return NextResponse.json(
        { error: "Framework step not found" },
        { status: 404 }
      );
    }

    const deleted = await deleteFrameworkStep(stepId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete framework step" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  });
}
