import { NextRequest, NextResponse } from "next/server";
import { requireAuth, assertOwner, requireRole, handleAuthz } from "@/lib/authz";
import { 
  getFrameworks, 
  createFramework, 
  parseConcepts, 
  stringifyConcepts 
} from "../../../models/knowledge";

/**
 * @swagger
 * components:
 *   schemas:
 *     Framework:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - description
 *         - concepts
 *         - is_system
 *       properties:
 *         id:
 *           type: integer
 *           description: Framework ID
 *         user_id:
 *           type: integer
 *           nullable: true
 *           description: User ID (null for system frameworks)
 *         name:
 *           type: string
 *           description: Framework name
 *         description:
 *           type: string
 *           description: Framework description
 *         concepts:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of concept tags
 *         is_system:
 *           type: boolean
 *           description: Whether this is a system framework
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateFrameworkRequest:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - concepts
 *       properties:
 *         user_id:
 *           type: integer
 *           nullable: true
 *         name:
 *           type: string
 *           minLength: 1
 *         description:
 *           type: string
 *           minLength: 1
 *         concepts:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of concept tags
 *         is_system:
 *           type: boolean
 *           default: false
 */

/**
 * @swagger
 * /frameworks:
 *   get:
 *     summary: Get all frameworks
 *     tags: [Frameworks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Admin may query any user_id; non-admins restricted to self
 *     responses:
 *       200:
 *         description: List of frameworks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Framework'
 */
export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const { searchParams } = new URL(req.url);
    const authUser = await requireAuth(req);
    const userIdParam = searchParams.get("user_id");
    const targetId = userIdParam ? parseInt(userIdParam) : authUser.id;
    if (userIdParam) assertOwner(authUser, targetId);
    const frameworks = await getFrameworks(targetId);
    const frameworksWithParsedConcepts = frameworks.map(framework => ({
      ...framework,
      concepts: parseConcepts(framework.concepts),
      is_system: Boolean(framework.is_system),
    }));
    return NextResponse.json(frameworksWithParsedConcepts);
  });
}

/**
 * @swagger
 * /frameworks:
 *   post:
 *     summary: Create a new framework
 *     tags: [Frameworks]
 *     security:
 *       - bearerAuth: []
 *     description: Only admins can create system frameworks or set user_id=null. Non-admins can only create personal frameworks for themselves.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFrameworkRequest'
 *     responses:
 *       201:
 *         description: Framework created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Framework'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(req: NextRequest) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const body = await req.json();
    let { user_id, name, description, concepts, is_system = false } = body;

    if (!name || !description || !concepts) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!Array.isArray(concepts)) {
      return NextResponse.json({ error: "Concepts must be an array" }, { status: 400 });
    }

    const ownerId = user_id ?? authUser.id;

    // if (is_system === true && authUser.role !== "admin" || authUser.role !== "admin") {
    if (is_system === true || user_id === null ) {
      requireRole(authUser, "admin");
    }
    assertOwner(authUser, ownerId);

    if (authUser.role !== "admin") {
      user_id = ownerId;
      is_system = false;
    }

    try {
      const newFramework = await createFramework({
        user_id: user_id || null,
        name,
        description,
        concepts: stringifyConcepts(concepts),
        is_system
      });

      const frameworkWithParsedConcepts = {
        ...newFramework,
        concepts: parseConcepts(newFramework.concepts),
        is_system: Boolean(newFramework.is_system),
      };

      return NextResponse.json(frameworkWithParsedConcepts, { status: 201 });
    } catch (err: any) {
      const msg = String(err?.message || "");
      const code = String((err && (err as any).code) || "");
      if (code.includes("SQLITE_CONSTRAINT") || msg.toUpperCase().includes("UNIQUE") || msg.toUpperCase().includes("CONSTRAINT")) {
        return NextResponse.json({ error: "Framework name already exists for this scope" }, { status: 409 });
      }
      throw err;
    }
  });
}
