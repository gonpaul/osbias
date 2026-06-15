import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth, handleAuthz } from "@/lib/authz";
import { getJournalEntryHeaders } from "../../../../models/journal";

/**
 * GET /api/journal/headers — lightweight list (no content) for sidebar
 */
export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    const headers = await getJournalEntryHeaders(authUser.id);
    return NextResponse.json(headers);
  });
}
