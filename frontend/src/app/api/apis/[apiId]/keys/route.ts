import { NextRequest, NextResponse } from "next/server";
import { getBackendAccessTokenFromRequest } from "@/lib/auth-server";
import { proxyBackendRequest } from "@/lib/backend-api";

type RouteContext = {
  params: Promise<{
    apiId: string;
  }>;
};

function getMissingBackendSessionResponse() {
  return NextResponse.json({ error: "Backend API session is missing. Please sign in again." }, { status: 401 });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const accessToken = getBackendAccessTokenFromRequest(request);

  if (!accessToken) {
    return getMissingBackendSessionResponse();
  }

  const { apiId } = await context.params;

  return proxyBackendRequest(`/api/v1/apis/${encodeURIComponent(apiId)}/keys`, accessToken, {
    method: "GET",
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const accessToken = getBackendAccessTokenFromRequest(request);

  if (!accessToken) {
    return getMissingBackendSessionResponse();
  }

  const { apiId } = await context.params;

  return proxyBackendRequest(`/api/v1/apis/${encodeURIComponent(apiId)}/keys`, accessToken, {
    method: "POST",
  });
}
