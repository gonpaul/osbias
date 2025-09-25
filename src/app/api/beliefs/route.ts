import { NextRequest, NextResponse } from "next/server";
import { requireAuth, assertOwner, handleAuthz } from "@/lib/authz";
import { 
  getBeliefs,
  createBelief
} from "../../../models/life";

/**
 * @swagger
 * components:
 *   schemas:
 *     Belief:
 *       type: object
 *       required:
 *         - id
 *         - user_id
 *         - belief
 *         - confidence_level
 *       properties:
 *         id:
 *           type: integer
 *           description: Belief ID
 *         user_id:
 *           type: integer
 *           description: User ID
 *         belief:
 *           type: string
 *           description: The belief statement
 *         confidence_level:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Confidence level (0-100)
 *         evidence:
 *           type: string
 *           nullable: true
 *           description: Supporting evidence
 *         created_at:
 *           type: string
 *           format: date-time
 *     CreateBeliefRequest:
 *       type: object
 *       required:
 *         - user_id
 *         - belief
 *         - confidence_level
 *       properties:
 *         user_id:
 *           type: integer
 *         belief:
 *           type: string
 *           minLength: 1
 *         confidence_level:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         evidence:
 *           type: string
 */

/**
 * @swagger
 * /beliefs:
 *   get:
 *     summary: Get beliefs for a user
 *     tags: [Beliefs]
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
 *         description: List of beliefs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Belief'
 */
export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("user_id");
    const authUser = await requireAuth(req);
    const targetId = userIdParam ? parseInt(userIdParam) : authUser.id;
    assertOwner(authUser, targetId);
    const beliefs = await getBeliefs(targetId);
    return NextResponse.json(beliefs);
  });
}

/**
 * @swagger
 * /beliefs:
 *   post:
 *     summary: Create a new belief
 *     tags: [Beliefs]
 *     security:
 *       - bearerAuth: []
 *     description: Non-admins can only create beliefs for themselves
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBeliefRequest'
 *     responses:
 *       201:
 *         description: Belief created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Belief'
 *       400:
 *         description: Bad request - missing required fields or invalid confidence level
 */
export async function POST(req: NextRequest) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const { user_id, belief, confidence_level, evidence } = body;

    const ownerId = user_id ?? authUser.id;
    assertOwner(authUser, ownerId);

    if (!ownerId || !belief || confidence_level === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    if (confidence_level < 0 || confidence_level > 100) {
      return NextResponse.json({ error: "Confidence level must be between 0 and 100" }, { status: 400 });
    }
    
    const newBelief = await createBelief({
      user_id: ownerId,
      belief,
      confidence_level,
      evidence: evidence || null
    });
    
    return NextResponse.json(newBelief, { status: 201 });
  });
}