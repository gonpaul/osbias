import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleAuthz } from "@/lib/authz";
import db from "@/lib/db";
import type { User } from "@/models/user";
import { getRemainingQuota } from "@/lib/rateLimit";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         name:
 *           type: string
 *           description: User's display name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *         email:
 *           type: string
 *           format: email
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */
export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    requireRole(authUser, "admin");

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const role = searchParams.get("role");
    const isTest = searchParams.get("is_test_user");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    let query = db<User>("users").select(
      "id",
      "name",
      "email",
      "role",
      "is_test_user",
      "rate_limit_quota",
      "exempt_from_rate_limit",
      "allow_posting",
      "plan",
      "created_at",
      "updated_at"
    );

    if (q) {
      query = query.where((qb) => {
        qb.whereILike("email", `%${q}%`).orWhereILike("name", `%${q}%`);
      });
    }
    if (role === "user" || role === "admin") {
      query = query.andWhere({ role });
    }
    if (isTest === "true" || isTest === "false") {
      query = query.andWhere({ is_test_user: isTest === "true" });
    }

    const [rawRows, [{ count }]] = await Promise.all([
      query.clone().orderBy("created_at", "desc").limit(limit).offset(offset),
      db("users").count<{ count: number }>("id as count").first().then((r) => [r || { count: 0 }]),
    ]);
    // attach remaining quota
    const rows = await Promise.all(
      rawRows.map(async (u) => ({ ...u, remaining_quota: await getRemainingQuota(u as User) }))
    );

    return NextResponse.json({ page, limit, total: Number(count || 0), rows });
  });
}

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
// export async function GET() {
//   const users = await getUsers();
//   return NextResponse.json(users);
// }

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// export async function POST(req: NextRequest) {
//   const body = await req.json();
//   const { name, email, password } = body;
//   if (!name || !email) {
//     return NextResponse.json({ error: "Missing fields" }, { status: 400 });
//   }
//   const newUser = await createUser({ name, email, password });
//   return NextResponse.json(newUser, { status: 201 });
// }
