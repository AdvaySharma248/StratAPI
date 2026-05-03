import { NextRequest, NextResponse } from "next/server";
import { getBackendAccessTokenFromRequest } from "@/lib/auth-server";
import { proxyBackendRequest } from "@/lib/backend-api";

type RouteContext = {
  params: Promise<{
    apiId: string;
    keyId: string;
  }>;
};

function getMissingBackendSessionResponse() {
  return NextResponse.json({ error: "Backend API session is missing. Please sign in again." }, { status: 401 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const accessToken = getBackendAccessTokenFromRequest(request);

  if (!accessToken) {
    return getMissingBackendSessionResponse();
  }

  const { apiId, keyId } = await context.params;

  return proxyBackendRequest(
    `/api/v1/apis/${encodeURIComponent(apiId)}/keys/${encodeURIComponent(keyId)}/rotate`,
    accessToken,
    {
      method: "POST",
    }
  );
}
