import { NextRequest, NextResponse } from "next/server";
import { getBackendAccessTokenFromRequest } from "@/lib/auth-server";
import { proxyBackendRequest } from "@/lib/backend-api";

function getMissingBackendSessionResponse() {
  return NextResponse.json({ error: "Backend API session is missing. Please sign in again." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const accessToken = getBackendAccessTokenFromRequest(request);

  if (!accessToken) {
    return getMissingBackendSessionResponse();
  }

  return proxyBackendRequest("/api/v1/apis", accessToken, {
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  const accessToken = getBackendAccessTokenFromRequest(request);

  if (!accessToken) {
    return getMissingBackendSessionResponse();
  }

  return proxyBackendRequest("/api/v1/apis", accessToken, {
    method: "POST",
    body: await request.text(),
    contentType: request.headers.get("content-type"),
  });
}
