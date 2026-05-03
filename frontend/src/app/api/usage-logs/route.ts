import { NextRequest, NextResponse } from "next/server";
import { getBackendAccessTokenFromRequest } from "@/lib/auth-server";
import { proxyBackendRequest } from "@/lib/backend-api";

export async function GET(request: NextRequest) {
  const accessToken = getBackendAccessTokenFromRequest(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Backend usage session is missing. Please sign in again." }, { status: 401 });
  }

  return proxyBackendRequest(`/api/v1/usage-logs${request.nextUrl.search}`, accessToken, {
    method: "GET",
  });
}
