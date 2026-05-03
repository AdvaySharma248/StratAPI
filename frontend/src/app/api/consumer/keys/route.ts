import { NextRequest, NextResponse } from "next/server";
import { getBackendAccessTokenFromRequest } from "@/lib/auth-server";
import { proxyBackendRequest } from "@/lib/backend-api";

// GET /api/consumer/keys
// Fetches all API keys assigned to the authenticated consumer's email from the backend.
export async function GET(request: NextRequest) {
  const accessToken = getBackendAccessTokenFromRequest(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Backend session missing. Please sign in again." },
      { status: 401 }
    );
  }

  return proxyBackendRequest("/api/v1/my-keys", accessToken, { method: "GET" });
}
