import { NextRequest, NextResponse } from "next/server";
import { authCookieName, rolePages } from "@/lib/auth-model";

// Lightweight session decode — no crypto in Edge runtime.
// The session is a base64url-encoded JSON payload (see auth-server.ts).
function decodeSessionPayload(encoded: string): { role?: string; exp?: number } | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    return JSON.parse(json) as { role?: string; exp?: number };
  } catch {
    return null;
  }
}

// Pages that require admin role
const adminOnlyPages = new Set(rolePages.admin);
// Pages that require consumer role
const consumerOnlyPages = new Set(rolePages.consumer);
// Pages that require owner role
const ownerOnlyPages = new Set(rolePages.owner);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /api/admin/* routes in middleware.
  // Page-level isolation is handled in the components + stratapi-app.tsx router.
  if (pathname.startsWith("/api/admin/")) {
    const sessionCookie = request.cookies.get(authCookieName)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const payload = decodeSessionPayload(sessionCookie);

    if (!payload) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    // Check session expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
