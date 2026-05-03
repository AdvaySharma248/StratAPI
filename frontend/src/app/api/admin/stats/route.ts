import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest, getBackendAccessTokenFromRequest } from "@/lib/auth-server";
import { proxyBackendRequest } from "@/lib/backend-api";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const sessionUser = getSessionUserFromRequest(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const accessToken = getBackendAccessTokenFromRequest(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Backend session missing. Please sign in again." }, { status: 401 });
  }

  try {
    // Total users from local DB
    const userCountRows = await db.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*) as count FROM "User"`;
    const totalUsers = Number(userCountRows[0]?.count ?? 0);

    // Proxy to backend for platform-wide API + usage stats
    const [apisResponse, logsResponse] = await Promise.all([
      proxyBackendRequest("/api/v1/apis", accessToken, { method: "GET" }),
      proxyBackendRequest("/api/v1/usage-logs?limit=500", accessToken, { method: "GET" }),
    ]);

    let totalApis = 0;
    let totalRequests = 0;

    if (apisResponse.ok) {
      const apisBody = (await apisResponse.json()) as { items?: Array<{ requests?: number; usageLogCount?: number }> };
      const apis = apisBody.items ?? [];
      totalApis = apis.length;
      totalRequests = apis.reduce(
        (sum, api) => sum + Number(api.requests ?? api.usageLogCount ?? 0),
        0
      );
    }

    // If backend requests count is 0 try to get it from logs
    if (totalRequests === 0 && logsResponse.ok) {
      const logsBody = (await logsResponse.clone().json()) as { items?: unknown[] };
      totalRequests = (logsBody.items ?? []).length;
    }

    return NextResponse.json({
      totalUsers,
      totalApis,
      totalRequests,
    });
  } catch (error) {
    console.error("Failed to fetch admin stats", error);
    return NextResponse.json({ error: "Unable to load system stats." }, { status: 500 });
  }
}
