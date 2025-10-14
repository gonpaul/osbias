import { NextRequest, NextResponse } from "next/server";
import { 
  getFrameworkWithSteps, 
  updateFramework, 
  deleteFramework,
  parseConcepts,
  stringifyConcepts,
  getFrameworkById
} from "../../../../models/knowledge";
import { requireAuth, assertOwner, requireRole, handleAuthz } from "@/lib/authz";

/**
 * @swagger
 * /frameworks/{id}:
 *   get:
 *     summary: Get a framework by ID with its steps
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
 *         description: Framework with steps
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Framework'
 *                 - type: object
 *                   properties:
 *                     steps:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FrameworkStep'
 *       404:
 *         description: Framework not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const framework = await getFrameworkWithSteps(parseInt(id));
    if (!framework) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }
    if (!framework.is_system) {
      assertOwner(authUser, framework.user_id as number);
    }
    const frameworkWithParsedConcepts = {
      ...framework,
      concepts: parseConcepts(framework.concepts)
    };
    return NextResponse.json(frameworkWithParsedConcepts);
  });
}

/**
 * @swagger
 * /frameworks/{id}:
 *   put:
 *     summary: Update a framework
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               concepts:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Framework updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Framework'
 *       404:
 *         description: Framework not found
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const existing = await getFrameworkById(parseInt(id));
    if (!existing) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }
    if (existing.is_system) {
      requireRole(authUser, "admin");
    } else {
      assertOwner(authUser, existing.user_id as number);
    }
    const body: Partial<{ name: string; description: string; concepts: string[] }> = await req.json();
    const { name, description, concepts } = body;
    const updates: Partial<{ name: string; description: string; concepts: string }> = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (concepts && Array.isArray(concepts)) {
      updates.concepts = stringifyConcepts(concepts);
    }
    const updatedFramework = await updateFramework(parseInt(id), updates);
    const frameworkWithParsedConcepts = {
      ...updatedFramework!,
      concepts: parseConcepts(updatedFramework!.concepts)
    };
    return NextResponse.json(frameworkWithParsedConcepts);
  });
}

/**
 * @swagger
 * /frameworks/{id}:
 *   delete:
 *     summary: Delete a framework
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
 *       204:
 *         description: Framework deleted successfully
 *       404:
 *         description: Framework not found
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const { id } = await params;
    const existing = await getFrameworkById(parseInt(id));
    if (!existing) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }
    if (existing.is_system) {
      requireRole(authUser, "admin");
    } else {
      assertOwner(authUser, existing.user_id as number);
    }
    const deleted = await deleteFramework(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  });
}
