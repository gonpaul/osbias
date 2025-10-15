import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    const login = new URL("/login", req.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect all pages except these:
    "/((?!api|_next/static|_next/image|favicon.ico|login|register|p).*)",
  ],
};
