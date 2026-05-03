import { NextRequest, NextResponse } from "next/server";
import { getBackendAccessTokenFromRequest } from "@/lib/auth-server";
import { proxyBackendRequest } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  const accessToken = getBackendAccessTokenFromRequest(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Backend billing session is missing. Please sign in again." }, { status: 401 });
  }

  return proxyBackendRequest("/api/v1/subscribe", accessToken, {
    method: "POST",
    body: await request.text(),
    contentType: request.headers.get("content-type"),
  });
}
